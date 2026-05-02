import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Telegram bot serveridan chaqirish: foydalanuvchi `/start TOKEN` bosganda
 * bot ushbu endpointga `token` va `telegramId` (va ixtiyoriy `username`) yuboradi.
 *
 * Sarlavha: `Authorization: Bearer <TELEGRAM_BOT_API_SECRET>`
 * Tanasi: `{ "token": "...", "telegramId": "123456789", "username": "optional" }`
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

  let body: { token?: string; telegramId?: string; username?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const idRaw = typeof body.telegramId === "string" ? body.telegramId.trim() : "";
  if (!token || !/^\d+$/.test(idRaw)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const telegramId = BigInt(idRaw);
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      telegramLinkToken: token,
      telegramLinkExpires: { gt: now },
    },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "token_not_found" }, { status: 404 });
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

  return NextResponse.json({ ok: true });
}
