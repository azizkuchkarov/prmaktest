import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default" as const;

/** Sozlamalar qatori (har o‘qishda `upsert` yozmaymiz — VPS/DB yuki kamayadi). */
export async function getAdminSiteSettingsRow() {
  const existing = await prisma.adminSiteSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  try {
    return await prisma.adminSiteSettings.create({ data: { id: SETTINGS_ID } });
  } catch {
    const again = await prisma.adminSiteSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (again) return again;
    throw new Error("admin_site_settings_init_failed");
  }
}

/**
 * Mehmon sahifa / kabinetga “yordam ulanganmi” kabi o‘qishlar.
 * Admin saqlaganda `revalidateTag("admin-site-settings", "max")` chaqiriladi.
 */
export const getAdminSiteSettingsCached = unstable_cache(
  () => getAdminSiteSettingsRow(),
  ["admin-site-settings-row"],
  { revalidate: 120, tags: ["admin-site-settings"] },
);

/**
 * Telegram chat_id: butun son qatori (shaxsiy chat — musbat, superguruh — odatda manfiy).
 * Bo'sh qator — yordam hali ulanmagan.
 */
export function normalizeSupportTelegramChatId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (!/^-?\d+$/.test(s)) return null;
  return s;
}

export function isKabinetSupportReady(supportTelegramChatId: string): boolean {
  return normalizeSupportTelegramChatId(supportTelegramChatId) !== null;
}
