"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isViloyat } from "@/lib/viloyats";
import { sitePublicLabel } from "@/lib/site-public";
import { sendTelegramPlainToChat } from "@/lib/telegram-broadcast";

const STUDENT_PASSWORD_MIN = 8;

function readRedirects(formData: FormData): { vil?: string; tel?: string } {
  const vilRaw = String(formData.get("redirectViloyat") ?? "").trim();
  const vil = vilRaw && isViloyat(vilRaw) ? vilRaw : undefined;
  const telRaw = String(formData.get("redirectTel") ?? "").trim();
  const tel = telRaw || undefined;
  return { vil, tel };
}

function listQuery(opts: {
  saved?: boolean;
  error?: string;
  userId?: string;
  viloyat?: string;
  tel?: string;
  tgErr?: string;
  tgOk?: number;
  tgFail?: number;
  pwdErr?: string;
}) {
  const q = new URLSearchParams();
  if (opts.saved) q.set("saved", "1");
  if (opts.error) q.set("error", opts.error);
  if (opts.userId) q.set("id", opts.userId);
  if (opts.viloyat && isViloyat(opts.viloyat)) q.set("viloyat", opts.viloyat);
  if (opts.tel) q.set("tel", opts.tel);
  if (opts.tgErr) q.set("tgErr", opts.tgErr);
  if (opts.tgOk != null) q.set("tgOk", String(opts.tgOk));
  if (opts.tgFail != null) q.set("tgFail", String(opts.tgFail));
  if (opts.pwdErr) q.set("pwdErr", opts.pwdErr);
  return q.toString();
}

function goError(code: string, userId?: string, vil?: string, tel?: string) {
  redirect(`/admin/userlar?${listQuery({ error: code, userId, viloyat: vil, tel })}`);
}

function okRedirect(vil?: string, tel?: string) {
  redirect(`/admin/userlar?${listQuery({ saved: true, viloyat: vil, tel })}`);
}

export async function updateUserTelegram(userId: string, formData: FormData) {
  const { vil: vilBack, tel: telBack } = readRedirects(formData);

  const raw = String(formData.get("telegramId") ?? "").trim();

  if (!raw) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
        telegramLinkToken: null,
        telegramLinkExpires: null,
      },
    });
    revalidatePath("/admin/userlar");
    okRedirect(vilBack, telBack);
  }

  if (!/^\d{5,20}$/.test(raw)) {
    goError("invalid", userId, vilBack, telBack);
  }

  const telegramId = BigInt(raw);

  const conflict = await prisma.user.findFirst({
    where: { telegramId, NOT: { id: userId } },
    select: { id: true },
  });
  if (conflict) goError("duplicate", undefined, vilBack, telBack);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId,
        telegramLinkedAt: new Date(),
        telegramLinkToken: null,
        telegramLinkExpires: null,
      },
    });
  } catch {
    goError("save", userId, vilBack, telBack);
  }

  revalidatePath("/admin/userlar");
  okRedirect(vilBack, telBack);
}

export async function updateParentTelegram(userId: string, formData: FormData) {
  const { vil: vilBack, tel: telBack } = readRedirects(formData);

  const raw = String(formData.get("parentTelegramId") ?? "").trim();

  if (!raw) {
    await prisma.user.update({
      where: { id: userId },
      data: { parentTelegramId: null },
    });
    revalidatePath("/admin/userlar");
    okRedirect(vilBack, telBack);
  }

  if (!/^\d{5,20}$/.test(raw)) {
    goError("invalid", userId, vilBack, telBack);
  }

  const parentTelegramId = BigInt(raw);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { parentTelegramId },
    });
  } catch {
    goError("save", userId, vilBack, telBack);
  }

  revalidatePath("/admin/userlar");
  okRedirect(vilBack, telBack);
}

export async function updateUserPassword(userId: string, formData: FormData) {
  const { vil: vilBack, tel: telBack } = readRedirects(formData);
  const p1 = String(formData.get("password") ?? "");
  const p2 = String(formData.get("password2") ?? "");

  if (p1.length < STUDENT_PASSWORD_MIN) {
    redirect(`/admin/userlar?${listQuery({ userId, viloyat: vilBack, tel: telBack, pwdErr: "short" })}`);
  }
  if (p1 !== p2) {
    redirect(`/admin/userlar?${listQuery({ userId, viloyat: vilBack, tel: telBack, pwdErr: "mismatch" })}`);
  }

  try {
    const passwordHash = await bcrypt.hash(p1, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  } catch {
    redirect(`/admin/userlar?${listQuery({ userId, viloyat: vilBack, tel: telBack, pwdErr: "save" })}`);
  }

  revalidatePath("/admin/userlar");
  redirect(
    `/admin/userlar?${listQuery({ saved: true, userId, viloyat: vilBack, tel: telBack })}`,
  );
}

export async function sendAdminUserParentTelegram(formData: FormData) {
  const { vil: vilBack, tel: telBack } = readRedirects(formData);

  const userId = String(formData.get("notifyUserId") ?? "").trim();
  const message = String(formData.get("notifyMessage") ?? "").trim();

  if (!userId || !message) {
    redirect(`/admin/userlar?${listQuery({ tgErr: "empty", viloyat: vilBack, tel: telBack })}`);
  }
  if (message.length > 4000) {
    redirect(
      `/admin/userlar?${listQuery({ tgErr: "long", userId, viloyat: vilBack, tel: telBack })}`,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramId: true, parentTelegramId: true },
  });
  if (!user) {
    redirect(`/admin/userlar?${listQuery({ tgErr: "nouser", viloyat: vilBack, tel: telBack })}`);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    redirect(
      `/admin/userlar?${listQuery({ tgErr: "notoken", userId, viloyat: vilBack, tel: telBack })}`,
    );
  }

  const chatIds: string[] = [];
  if (user.telegramId != null) chatIds.push(user.telegramId.toString());
  if (user.parentTelegramId != null) chatIds.push(user.parentTelegramId.toString());
  const uniqueIds = [...new Set(chatIds)];

  if (uniqueIds.length === 0) {
    redirect(
      `/admin/userlar?${listQuery({
        tgErr: "norecipients",
        userId,
        viloyat: vilBack,
        tel: telBack,
      })}`,
    );
  }

  const payload = `📢 ${sitePublicLabel()} — administrator xabari\n\n${message}`;

  let tgOk = 0;
  let tgFail = 0;
  for (const chatId of uniqueIds) {
    const sent = await sendTelegramPlainToChat(chatId, payload);
    if (sent) tgOk += 1;
    else tgFail += 1;
    await new Promise((r) => setTimeout(r, 60));
  }

  revalidatePath("/admin/userlar");
  redirect(
    `/admin/userlar?${listQuery({ userId, viloyat: vilBack, tel: telBack, tgOk, tgFail })}`,
  );
}
