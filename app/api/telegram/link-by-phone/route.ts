import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { phoneKeysForLookup } from "@/lib/phone";

export const dynamic = "force-dynamic";

/**
 * Telegram bot: foydalanuvchi kontakt ulashganda.
 * `User.phone` bilan topiladi (bir nechta normalizatsiya varianti).
 *
 * Sarlavha: `Authorization: Bearer <TELEGRAM_BOT_API_SECRET>`
 * Tanasi: `{ "phone": "+99890...", "telegramId": "123456789", "username": "ixtiyoriy" }`
 */
export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_BOT_API_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || secret.length < 16) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { phone?: string; telegramId?: string; username?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const idRaw = typeof body.telegramId === "string" ? body.telegramId.trim() : "";
  if (!phoneRaw || !/^\d+$/.test(idRaw)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const keys = phoneKeysForLookup(phoneRaw);
  if (keys.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  const telegramId = BigInt(idRaw);

  let user =
    keys.length > 0
      ? await prisma.user.findFirst({ where: { phone: { in: keys } } })
      : null;

  // Oxirgi 9 raqam (9XXXXXXXX) bo‘yicha yagona mos kelish — Telegram/baza formatlari chetga chiqganda
  if (!user) {
    const d = phoneRaw.replace(/\D/g, "");
    const suffix = d.length >= 9 ? d.slice(-9) : "";
    if (/^9\d{8}$/.test(suffix)) {
      const candidates = await prisma.user.findMany({
        where: { phone: { endsWith: suffix } },
        take: 3,
        select: { id: true },
      });
      if (candidates.length === 1) {
        user = await prisma.user.findUnique({ where: { id: candidates[0].id } });
      }
    }
  }

  if (!user) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  if (user.telegramId != null && user.telegramId === telegramId) {
    return NextResponse.json({ ok: true, userId: user.id, already_linked: true });
  }

  if (user.telegramId != null && user.telegramId !== telegramId) {
    return NextResponse.json({ ok: false, error: "phone_already_linked_other_telegram" }, { status: 409 });
  }

  const taken = await prisma.user.findFirst({
    where: { telegramId, NOT: { id: user.id } },
  });
  if (taken) {
    return NextResponse.json({ ok: false, error: "telegram_already_linked" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramId,
      telegramUsername: body.username?.trim() || null,
      telegramLinkedAt: new Date(),
      telegramLinkToken: null,
      telegramLinkExpires: null,
    },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
