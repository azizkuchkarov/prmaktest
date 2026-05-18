import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { sitePublicLabel, sitePublicOrigin } from "@/lib/site-public";
import { isValidStudentGrade } from "@/lib/student-grade";
import { getStudentRankSummary } from "@/lib/student-ranking";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type SendOpts = { parseMode?: "HTML" };

async function sendOne(token: string, chatId: string, text: string, opts?: SendOpts): Promise<boolean> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
  };
  if (opts?.parseMode) body.parse_mode = opts.parseMode;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) return true;

  let errBody = "";
  try {
    errBody = await res.text();
    console.warn("[telegram sendMessage]", res.status, errBody.slice(0, 500));
  } catch {
    console.warn("[telegram sendMessage]", res.status);
  }

  if (res.status === 429) {
    let retryAfterSec = 2;
    try {
      const j = JSON.parse(errBody) as { parameters?: { retry_after?: number } };
      if (typeof j?.parameters?.retry_after === "number") {
        retryAfterSec = j.parameters.retry_after;
      }
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, retryAfterSec * 1000));
    const res2 = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res2.ok;
  }

  return false;
}

/** Admin yoki boshqa joydan bitta chatga oddiy matn (HTML emas). */
export async function sendTelegramPlainToChat(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return false;
  const t = text.trim();
  if (!t) return false;
  return sendOne(token, chatId, t.slice(0, 4096));
}

const RANK_FOLLOWUP_DELAY_MS = 60_000;

function attachBackgroundWork(work: Promise<void>): void {
  void work.catch((e) => console.error("[telegram-background]", e));
  try {
    waitUntil(work);
  } catch {
    /* mahalliy muhit: waitUntil konteksti bo‘lmasligi mumkin */
  }
}

/**
 * Nashr etilgan yangilik haqida Telegram bog‘langan foydalanuvchilarga xabar.
 */
export async function notifyTelegramNewsPublished(newsId: string, title: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;

  const origin = sitePublicOrigin();
  const label = escapeHtml(sitePublicLabel());
  const link = `${origin}/yangiliklar/${newsId}`;
  const safeTitle = escapeHtml(title.trim().slice(0, 400));

  const text = [
    `<b>📰 Yangilik</b>`,
    `🌐 <a href="${origin}">${label}</a>`,
    ``,
    safeTitle,
    ``,
    `👉 <a href="${link}">Saytda o‘qish</a>`,
  ].join("\n");

  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: { telegramId: true },
  });

  for (const u of users) {
    if (u.telegramId == null) continue;
    const chatId = u.telegramId.toString();
    try {
      await sendOne(token, chatId, text, { parseMode: "HTML" });
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 40));
  }
}

/**
 * Nashr etilgan test haqida Telegram bog‘langan foydalanuvchilarga xabar.
 */
export async function notifyTelegramTestPublished(testId: string, title: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;

  const origin = sitePublicOrigin();
  const label = escapeHtml(sitePublicLabel());
  const link = `${origin}/testlar/${testId}`;
  const safeTitle = escapeHtml(title.trim().slice(0, 400));

  const text = [
    `<b>📝 Yangi test</b>`,
    `🌐 <a href="${origin}">${label}</a>`,
    ``,
    safeTitle,
    ``,
    `👉 <a href="${link}">Saytda yechish</a>`,
  ].join("\n");

  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: { telegramId: true },
  });

  for (const u of users) {
    if (u.telegramId == null) continue;
    const chatId = u.telegramId.toString();
    try {
      await sendOne(token, chatId, text, { parseMode: "HTML" });
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 40));
  }
}

function formatDurationUz(secondsUsed: number): string {
  const s = Math.max(0, Math.floor(secondsUsed));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r} soniya`;
  if (r === 0) return `${m} daqiqa`;
  return `${m} daqiqa ${r} soniya`;
}

export type OfficialTestTelegramPayload = {
  userId: string;
  testId: string;
  testTitle: string;
  score: number;
  total: number;
  secondsUsed: number;
  rankPoints: number;
};

/**
 * Rasmiy topshiruvdan keyin: 1) darhol natija (shu so‘rovda yuboriladi); 2) ~1 daqiqa keyin reyting.
 * O‘quvchi va ota-ona (`parentTelegramId`) alohida chatlarga oladi; bir xil chat ID takrorlanmaydi.
 * Qayta yechish (mashq) uchun chaqirilmaydi.
 */
export async function notifyOfficialTestCompletionTelegram(payload: OfficialTestTelegramPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    console.warn("[telegram-test-complete] TELEGRAM_BOT_TOKEN .env da yo‘q — xabar yuborilmaydi.");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      telegramId: true,
      parentTelegramId: true,
      firstName: true,
      lastName: true,
      viloyat: true,
      gradeLevel: true,
    },
  });
  if (!user) {
    console.warn("[telegram-test-complete] Foydalanuvchi topilmadi.");
    return;
  }

  const studentChat = user.telegramId != null ? user.telegramId.toString() : null;
  const parentChat = user.parentTelegramId != null ? user.parentTelegramId.toString() : null;
  const targets: Array<{ chatId: string; role: "student" | "parent" }> = [];
  if (studentChat) targets.push({ chatId: studentChat, role: "student" });
  if (parentChat && parentChat !== studentChat) targets.push({ chatId: parentChat, role: "parent" });

  if (targets.length === 0) {
    console.warn(
      "[telegram-test-complete] Telegram yo‘q: na o‘quvchi, na ota-ona chat ID (admin panelda kiriting).",
    );
    return;
  }

  const origin = sitePublicOrigin();
  const label = escapeHtml(sitePublicLabel());
  const titleEsc = escapeHtml(payload.testTitle.trim().slice(0, 300));
  const wrong = payload.total - payload.score;

  const childName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "O'quvchi";
  const childNameEsc = escapeHtml(childName.slice(0, 120));

  const buildCompletionHtml = (role: "student" | "parent") => {
    const head =
      role === "parent"
        ? [`<b>✅ Farzandingiz testni yakunladi</b>`, `👤 <b>O'quvchi:</b> ${childNameEsc}`, ``]
        : [`<b>✅ Test yakunlandi</b>`, ``];
    return [
      ...head,
      `🌐 <a href="${origin}">${label}</a>`,
      ``,
      `<b>${titleEsc}</b>`,
      ``,
      `✅ To‘g‘ri: <b>${payload.score}</b>`,
      `❌ Xato: <b>${wrong}</b>`,
      `⏱ Sarflangan vaqt: <b>${formatDurationUz(payload.secondsUsed)}</b>`,
      `🏆 Reyting balli: <b>+${payload.rankPoints}</b>`,
      ``,
      `👉 <a href="${origin}/testlar/${payload.testId}">Natija · ${label}</a>`,
    ].join("\n");
  };

  const buildCompletionPlain = (role: "student" | "parent") => {
    const head =
      role === "parent"
        ? [
            `✅ Farzandingiz testni yakunladi · ${sitePublicLabel()}`,
            `O'quvchi: ${childName}`,
            ``,
          ]
        : [`✅ Test yakunlandi · ${sitePublicLabel()}`, ``];
    return [
      ...head,
      payload.testTitle.trim(),
      ``,
      `To'g'ri: ${payload.score}`,
      `Xato: ${wrong}`,
      `Vaqt: ${formatDurationUz(payload.secondsUsed)}`,
      `Reyting balli: +${payload.rankPoints}`,
      ``,
      `${origin}/testlar/${payload.testId}`,
    ].join("\n");
  };

  for (const t of targets) {
    const msgHtml = buildCompletionHtml(t.role);
    const msgPlain = buildCompletionPlain(t.role);
    let sent = await sendOne(token, t.chatId, msgHtml, { parseMode: "HTML" });
    if (!sent) {
      sent = await sendOne(token, t.chatId, msgPlain);
    }
    if (!sent) {
      console.warn(
        "[telegram-test-complete] Xabar yuborilmadi (chat:",
        t.chatId,
        "role:",
        t.role,
        ") — bot /start qilinganmi?",
      );
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  const { viloyat, gradeLevel } = user;

  const followUp = (async () => {
    await new Promise((r) => setTimeout(r, RANK_FOLLOWUP_DELAY_MS));

    const gradeScope = isValidStudentGrade(gradeLevel) ? gradeLevel : null;
    const summary = await getStudentRankSummary(payload.userId, viloyat, gradeScope);

    const buildRankHtml = (role: "student" | "parent") => {
      const titleLine =
        role === "parent"
          ? `<b>📊 Reyting</b> <i>(1 daqiqa keyin — jadval yangilangan. ${childNameEsc})</i>`
          : `<b>📊 Reyting</b> <i>(1 daqiqa keyin — jadval yangilangan)</i>`;
      const orinTitle =
        role === "parent"
          ? `<b>${childNameEsc} ning o‘rni</b>`
          : `<b>Sizning o‘rningiz</b>`;
      const lines = [
        titleLine,
        `🌐 <a href="${origin}">${label}</a>`,
        ``,
        orinTitle,
        `   📍 Respublika: <b>${summary.republicRank ?? "—"}</b>`,
        `   📍 Viloyat: <b>${summary.viloyatRank ?? "—"}</b>`,
      ];
      if (summary.gradeRepublicRank != null) {
        lines.push(`   📍 Sinf (respublika): <b>${summary.gradeRepublicRank}</b>`);
      }
      if (summary.gradeViloyatRank != null) {
        lines.push(`   📍 Sinf (viloyat): <b>${summary.gradeViloyatRank}</b>`);
      }
      lines.push(``, `🎯 Jami ball: <b>${summary.totalPoints}</b>`, ``);
      lines.push(`👉 <a href="${origin}/kabinet">Kabinet · ${label}</a>`);
      return lines.join("\n");
    };

    for (const t of targets) {
      const rankHtml = buildRankHtml(t.role);
      const ok2 = await sendOne(token, t.chatId, rankHtml, { parseMode: "HTML" });
      if (!ok2) {
        const plainRank = [
          t.role === "parent"
            ? `📊 Reyting (1 daqiqa keyin) · ${childName} · ${sitePublicLabel()}`
            : `📊 Reyting (1 daqiqa keyin) · ${sitePublicLabel()}`,
          "",
          t.role === "parent" ? `${childName} ning o'rni:` : "Sizning o'rningiz:",
          `Respublika: ${summary.republicRank ?? "—"}`,
          `Viloyat: ${summary.viloyatRank ?? "—"}`,
          summary.gradeRepublicRank != null ? `Sinf (RB): ${summary.gradeRepublicRank}` : "",
          summary.gradeViloyatRank != null ? `Sinf (viloyat): ${summary.gradeViloyatRank}` : "",
          "",
          `Jami ball: ${summary.totalPoints}`,
          `${origin}/kabinet`,
        ]
          .filter(Boolean)
          .join("\n");
        await sendOne(token, t.chatId, plainRank);
      }
      await new Promise((r) => setTimeout(r, 80));
    }
  })();

  attachBackgroundWork(followUp);
}
