"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseAdminListContext, adminListPath, type AdminListContext } from "@/lib/admin-list-context";
import { prisma } from "@/lib/prisma";
import { normalizeUzbekPhone } from "@/lib/phone";
import { isViloyat } from "@/lib/viloyats";
import { sitePublicLabel } from "@/lib/site-public";
import { sendTelegramPlainToChat } from "@/lib/telegram-broadcast";

const STUDENT_PASSWORD_MIN = 8;

function readRedirects(formData: FormData): { vil?: string; tel?: string; ctx: AdminListContext } {
  const vilRaw = String(formData.get("redirectViloyat") ?? "").trim();
  const vil = vilRaw && isViloyat(vilRaw) ? vilRaw : undefined;
  const telRaw = String(formData.get("redirectTel") ?? "").trim();
  const tel = telRaw || undefined;
  const ctx = parseAdminListContext(formData.get("adminListContext"));
  return { vil, tel, ctx };
}

function listQuery(opts: {
  saved?: boolean;
  deleted?: boolean;
  error?: string;
  userId?: string;
  viloyat?: string;
  tel?: string;
  tgErr?: string;
  tgOk?: number;
  tgFail?: number;
  pwdErr?: string;
  delErr?: string;
}) {
  const q = new URLSearchParams();
  if (opts.saved) q.set("saved", "1");
  if (opts.deleted) q.set("deleted", "1");
  if (opts.error) q.set("error", opts.error);
  if (opts.userId) q.set("id", opts.userId);
  if (opts.viloyat && isViloyat(opts.viloyat)) q.set("viloyat", opts.viloyat);
  if (opts.tel) q.set("tel", opts.tel);
  if (opts.tgErr) q.set("tgErr", opts.tgErr);
  if (opts.tgOk != null) q.set("tgOk", String(opts.tgOk));
  if (opts.tgFail != null) q.set("tgFail", String(opts.tgFail));
  if (opts.pwdErr) q.set("pwdErr", opts.pwdErr);
  if (opts.delErr) q.set("delErr", opts.delErr);
  return q.toString();
}

function redirectList(
  opts: Parameters<typeof listQuery>[0] extends infer P ? P : never,
  ctx: AdminListContext,
): never {
  redirect(`${adminListPath(ctx)}?${listQuery(opts)}`);
}

function goError(code: string, ctx: AdminListContext, userId?: string, vil?: string, tel?: string): never {
  redirectList({ error: code, userId, viloyat: vil, tel }, ctx);
}

function okRedirect(ctx: AdminListContext, vil?: string, tel?: string): never {
  redirectList({ saved: true, viloyat: vil, tel }, ctx);
}

function revalidateAdminPersonLists() {
  revalidatePath("/admin/userlar");
  revalidatePath("/admin/oqituvchilar");
  revalidatePath("/admin/oqituvchi-tasdiq");
}

export async function updateUserTelegram(userId: string, formData: FormData) {
  const { vil: vilBack, tel: telBack, ctx } = readRedirects(formData);

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
    revalidateAdminPersonLists();
    okRedirect(ctx, vilBack, telBack);
  }

  if (!/^\d{5,20}$/.test(raw)) {
    goError("invalid", ctx, userId, vilBack, telBack);
  }

  const telegramId = BigInt(raw);

  const conflict = await prisma.user.findFirst({
    where: { telegramId, NOT: { id: userId } },
    select: { id: true },
  });
  if (conflict) goError("duplicate", ctx, undefined, vilBack, telBack);

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
    goError("save", ctx, userId, vilBack, telBack);
  }

  revalidateAdminPersonLists();
  okRedirect(ctx, vilBack, telBack);
}

export async function updateParentTelegram(userId: string, formData: FormData) {
  const { vil: vilBack, tel: telBack, ctx } = readRedirects(formData);

  const raw = String(formData.get("parentTelegramId") ?? "").trim();

  if (!raw) {
    await prisma.user.update({
      where: { id: userId },
      data: { parentTelegramId: null },
    });
    revalidateAdminPersonLists();
    okRedirect(ctx, vilBack, telBack);
  }

  if (!/^\d{5,20}$/.test(raw)) {
    goError("invalid", ctx, userId, vilBack, telBack);
  }

  const parentTelegramId = BigInt(raw);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { parentTelegramId },
    });
  } catch {
    goError("save", ctx, userId, vilBack, telBack);
  }

  revalidateAdminPersonLists();
  okRedirect(ctx, vilBack, telBack);
}

export async function updateUserPassword(userId: string, formData: FormData) {
  const { vil: vilBack, tel: telBack, ctx } = readRedirects(formData);
  const p1 = String(formData.get("password") ?? "");
  const p2 = String(formData.get("password2") ?? "");

  if (p1.length < STUDENT_PASSWORD_MIN) {
    redirectList({ userId, viloyat: vilBack, tel: telBack, pwdErr: "short" }, ctx);
  }
  if (p1 !== p2) {
    redirectList({ userId, viloyat: vilBack, tel: telBack, pwdErr: "mismatch" }, ctx);
  }

  try {
    const passwordHash = await bcrypt.hash(p1, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  } catch {
    redirectList({ userId, viloyat: vilBack, tel: telBack, pwdErr: "save" }, ctx);
  }

  revalidateAdminPersonLists();
  redirectList({ saved: true, userId, viloyat: vilBack, tel: telBack }, ctx);
}

export async function sendAdminUserParentTelegram(formData: FormData) {
  const { vil: vilBack, tel: telBack, ctx } = readRedirects(formData);

  const userId = String(formData.get("notifyUserId") ?? "").trim();
  const message = String(formData.get("notifyMessage") ?? "").trim();

  if (!userId || !message) {
    redirectList({ tgErr: "empty", viloyat: vilBack, tel: telBack }, ctx);
  }
  if (message.length > 4000) {
    redirectList({ tgErr: "long", userId, viloyat: vilBack, tel: telBack }, ctx);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramId: true, parentTelegramId: true },
  });
  if (!user) {
    redirectList({ tgErr: "nouser", viloyat: vilBack, tel: telBack }, ctx);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    redirectList({ tgErr: "notoken", userId, viloyat: vilBack, tel: telBack }, ctx);
  }

  const chatIds: string[] = [];
  if (user.telegramId != null) chatIds.push(user.telegramId.toString());
  if (user.parentTelegramId != null) chatIds.push(user.parentTelegramId.toString());
  const uniqueIds = [...new Set(chatIds)];

  if (uniqueIds.length === 0) {
    redirectList(
      {
        tgErr: "norecipients",
        userId,
        viloyat: vilBack,
        tel: telBack,
      },
      ctx,
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

  revalidateAdminPersonLists();
  redirectList({ userId, viloyat: vilBack, tel: telBack, tgOk, tgFail }, ctx);
}

/** STUDENT / TEACHER / TEACHER_PENDING — virtual sinflar o‘qituvchi uchun cascade bilan yoʻqoladi */
export async function deleteAdminUser(formData: FormData) {
  const { vil: vilBack, tel: telBack, ctx } = readRedirects(formData);
  const userId = String(formData.get("deleteUserId") ?? "").trim();
  const phoneConfirmRaw = String(formData.get("deletePhoneConfirm") ?? "");
  const ackDelete = formData.get("ackDelete") === "on";
  const ackTeacherCascade = formData.get("ackTeacherCascade") === "on";

  if (!userId) {
    redirectList({ delErr: "noid", viloyat: vilBack, tel: telBack }, ctx);
  }
  if (!ackDelete) {
    redirectList({ delErr: "noack", userId, viloyat: vilBack, tel: telBack }, ctx);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { appUserRole: true, phone: true },
  });

  if (!user) {
    redirectList({ delErr: "notfound", viloyat: vilBack, tel: telBack }, ctx);
  }

  if (user.appUserRole !== "STUDENT" && !ackTeacherCascade) {
    redirectList({ delErr: "teacher_ack", userId, viloyat: vilBack, tel: telBack }, ctx);
  }

  const phoneNorm = normalizeUzbekPhone(phoneConfirmRaw);
  if (!phoneNorm || phoneNorm !== user.phone) {
    redirectList({ delErr: "phone", userId, viloyat: vilBack, tel: telBack }, ctx);
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    redirectList({ delErr: "save", userId, viloyat: vilBack, tel: telBack }, ctx);
  }

  revalidateAdminPersonLists();
  redirectList({ deleted: true, viloyat: vilBack, tel: telBack }, ctx);
}
