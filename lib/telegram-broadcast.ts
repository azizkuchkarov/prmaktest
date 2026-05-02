import { prisma } from "@/lib/prisma";

function appOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();
  return raw.replace(/\/+$/, "");
}

async function sendOne(token: string, chatId: string, text: string): Promise<boolean> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: false,
    }),
  });

  if (res.ok) return true;

  if (res.status === 429) {
    let retryAfterSec = 2;
    try {
      const j = (await res.json()) as { parameters?: { retry_after?: number } };
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
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: false,
      }),
    });
    return res2.ok;
  }

  return false;
}

/**
 * Nashr etilgan yangilik haqida barcha Telegram ID si bor foydalanuvchilarga xabar.
 * Xatoliklar yangilikni saqlashni buzmaydi.
 */
export async function notifyTelegramTestPublished(testId: string, title: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;

  const link = `${appOrigin()}/testlar/${testId}`;
  const safeTitle = title.trim().slice(0, 400);
  const text = `📝 Yangi test (nashr)\n\n${safeTitle}\n\n🔗 ${link}`;

  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: { telegramId: true },
  });

  for (const u of users) {
    if (u.telegramId == null) continue;
    const chatId = u.telegramId.toString();
    try {
      await sendOne(token, chatId, text);
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 40));
  }
}

export async function notifyTelegramNewsPublished(newsId: string, title: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;

  const link = `${appOrigin()}/yangiliklar/${newsId}`;
  const safeTitle = title.trim().slice(0, 400);
  const text = `📰 Yangilik\n\n${safeTitle}\n\n🔗 ${link}`;

  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: { telegramId: true },
  });

  for (const u of users) {
    if (u.telegramId == null) continue;
    const chatId = u.telegramId.toString();
    try {
      await sendOne(token, chatId, text);
    } catch {
      /* bitta foydalanuvchi xatosi butun jarayonni to'xtatmasin */
    }
    await new Promise((r) => setTimeout(r, 40));
  }
}
