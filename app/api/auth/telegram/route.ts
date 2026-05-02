import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramLoginQuery } from "@/lib/telegram-login";
import { STUDENT_SESSION_COOKIE, verifyStudentToken } from "@/lib/student-session";

export const dynamic = "force-dynamic";

/** Telegram Login Widget redirect (GET) */
export async function GET(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.redirect(new URL("/kabinet?telegram=not_configured", request.url));
  }

  const verified = verifyTelegramLoginQuery(request.nextUrl.searchParams, botToken);
  if (!verified) {
    return NextResponse.redirect(new URL("/kabinet?telegram=invalid", request.url));
  }

  const cookie = request.cookies.get(STUDENT_SESSION_COOKIE)?.value;
  const userId = cookie ? await verifyStudentToken(cookie) : null;
  if (!userId) {
    return NextResponse.redirect(new URL("/auth/kirish?telegram=need_login", request.url));
  }

  try {
    const existing = await prisma.user.findUnique({ where: { telegramId: verified.id } });
    if (existing && existing.id !== userId) {
      return NextResponse.redirect(new URL("/kabinet?telegram=in_use", request.url));
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: verified.id,
        telegramUsername: verified.username ?? null,
        telegramLinkedAt: new Date(),
        telegramLinkToken: null,
        telegramLinkExpires: null,
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/kabinet?telegram=error", request.url));
  }

  return NextResponse.redirect(new URL("/kabinet?telegram=linked", request.url));
}
