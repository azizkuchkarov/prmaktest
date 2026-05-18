import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default" as const;

export async function getAdminSiteSettingsRow() {
  return prisma.adminSiteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });
}

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
