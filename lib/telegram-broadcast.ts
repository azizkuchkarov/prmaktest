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
    select: { telegramId: true, viloyat: true, gradeLevel: true },
  });
  if (user?.telegramId == null) {
    console.warn(
      "[telegram-test-complete] Bu akkauntda Telegram ulangan emas (Kabinet → bot orqali bog‘lang).",
    );
    return;
  }

  const chatId = user.telegramId.toString();
  const origin = sitePublicOrigin();
  const label = escapeHtml(sitePublicLabel());
  const titleEsc = escapeHtml(payload.testTitle.trim().slice(0, 300));
  const wrong = payload.total - payload.score;

  const msg1 = [
    `<b>✅ Test yakunlandi</b>`,
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

  const plain1 = [
    `✅ Test yakunlandi · ${sitePublicLabel()}`,
    ``,
    payload.testTitle.trim(),
    ``,
    `To'g'ri: ${payload.score}`,
    `Xato: ${wrong}`,
    `Vaqt: ${formatDurationUz(payload.secondsUsed)}`,
    `Reyting balli: +${payload.rankPoints}`,
    ``,
    `${origin}/testlar/${payload.testId}`,
  ].join("\n");

  let sent = await sendOne(token, chatId, msg1, { parseMode: "HTML" });
  if (!sent) {
    console.warn("[telegram-test-complete] HTML xabar rad etildi, oddiy matn bilan qayta uriniladi.");
    sent = await sendOne(token, chatId, plain1);
  }
  if (!sent) {
    console.warn(
      "[telegram-test-complete] Telegram birinchi xabarni qabul qilmadi. Bot foydalanuvchi bilan suhbatni boshlaganmi? chat_id to‘g‘rimi?",
    );
    return;
  }

  const viloyat = user.viloyat;
  const gradeLevel = user.gradeLevel;

  const followUp = (async () => {
    await new Promise((r) => setTimeout(r, RANK_FOLLOWUP_DELAY_MS));

    const gradeScope = isValidStudentGrade(gradeLevel) ? gradeLevel : null;
    const summary = await getStudentRankSummary(payload.userId, viloyat, gradeScope);

    const lines = [
      `<b>📊 Reyting</b> <i>(1 daqiqa keyin — jadval yangilangan)</i>`,
      `🌐 <a href="${origin}">${label}</a>`,
      ``,
      `<b>Sizning o‘rningiz</b>`,
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
    lines.push(`👉 <a href="${origin}/kabinet">Kabinet · to‘liq jadval</a>`);

    const ok2 = await sendOne(token, chatId, lines.join("\n"), { parseMode: "HTML" });
    if (!ok2) {
      console.warn("[telegram-test-complete] Reyting xabari yuborilmadi (API xatosi yoki vaqt tugashi).");
    }
  })();

  attachBackgroundWork(followUp);
}
