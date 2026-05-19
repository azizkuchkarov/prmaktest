"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminSessionValid } from "@/lib/auth-session";
import { getAdminSiteSettingsRow, normalizeSupportTelegramChatId } from "@/lib/admin-site-settings";
import { prisma } from "@/lib/prisma";

export type SupportSettingsState = { ok?: boolean; error?: "auth" | "invalid" };

export async function saveSupportTelegramSettings(
  _prev: SupportSettingsState | undefined,
  formData: FormData,
): Promise<SupportSettingsState | undefined> {
  if (!(await isAdminSessionValid())) return { error: "auth" };

  const raw = String(formData.get("supportTelegramChatId") ?? "");
  const trimmed = raw.trim();

  let value = "";
  if (trimmed !== "") {
    const normalized = normalizeSupportTelegramChatId(trimmed);
    if (normalized === null) return { error: "invalid" };
    value = normalized;
  }

  await prisma.adminSiteSettings.update({
    where: { id: "default" },
    data: { supportTelegramChatId: value },
  });

  revalidateTag("admin-site-settings", "max");
  revalidatePath("/admin/sozlamalar");
  revalidatePath("/kabinet");
  revalidatePath("/");
  return { ok: true };
}

export async function getSupportSettingsForAdminForm() {
  if (!(await isAdminSessionValid())) return null;
  const row = await getAdminSiteSettingsRow();
  return { supportTelegramChatId: row.supportTelegramChatId };
}
