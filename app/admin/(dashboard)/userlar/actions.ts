"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isViloyat } from "@/lib/viloyats";

function listQuery(opts: { saved?: boolean; error?: string; userId?: string; viloyat?: string }) {
  const q = new URLSearchParams();
  if (opts.saved) q.set("saved", "1");
  if (opts.error) q.set("error", opts.error);
  if (opts.userId) q.set("id", opts.userId);
  if (opts.viloyat && isViloyat(opts.viloyat)) q.set("viloyat", opts.viloyat);
  return q.toString();
}

function goError(code: string, userId?: string, viloyat?: string) {
  redirect(`/admin/userlar?${listQuery({ error: code, userId, viloyat })}`);
}

function okRedirect(viloyat?: string) {
  redirect(`/admin/userlar?${listQuery({ saved: true, viloyat })}`);
}

export async function updateUserTelegram(userId: string, formData: FormData) {
  const vilRaw = String(formData.get("redirectViloyat") ?? "").trim();
  const vilBack = vilRaw && isViloyat(vilRaw) ? vilRaw : undefined;

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
    okRedirect(vilBack);
  }

  if (!/^\d{5,20}$/.test(raw)) {
    goError("invalid", userId, vilBack);
  }

  const telegramId = BigInt(raw);

  const conflict = await prisma.user.findFirst({
    where: { telegramId, NOT: { id: userId } },
    select: { id: true },
  });
  if (conflict) goError("duplicate", undefined, vilBack);

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
    goError("save", userId, vilBack);
  }

  revalidatePath("/admin/userlar");
  okRedirect(vilBack);
}
