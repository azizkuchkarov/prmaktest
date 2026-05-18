"use server";

import { getAdminSiteSettingsRow, normalizeSupportTelegramChatId } from "@/lib/admin-site-settings";
import { formatPhoneDisplay, normalizeUzbekPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { sitePublicLabel } from "@/lib/site-public";
import { sendTelegramPlainToChat } from "@/lib/telegram-broadcast";

const MIN_LEN = 15;
const MAX_LEN = 2000;
const NAME_MAX = 80;
const RATE_MIN_MS = 120_000;
const RATE_DAY_MAX = 8;

export type SubmitLandingSupportState =
  | undefined
  | {
      ok?: boolean;
      error?:
        | "empty"
        | "short"
        | "long"
        | "badphone"
        | "namelong"
        | "noconfig"
        | "notoken"
        | "rate_short"
        | "rate_day"
        | "sendfail";
    };

function sanitizeProblem(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
}

function sanitizeName(raw: string): string {
  return raw.replace(/[\x00-\x1F]/g, "").trim().slice(0, NAME_MAX);
}

function formatNowTashkent(): string {
  return new Date().toLocaleString("uz-UZ", {
    timeZone: "Asia/Tashkent",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildLandingSupportTelegramText(opts: {
  label: string;
  name: string;
  phoneDisplay: string;
  problem: string;
  sentAt: string;
}): string {
  const lines = [
    `🌐 LANDING — 24/7 YORDAM — ${opts.label}`,
    `────────────────────────`,
    `👤 Ism: ${opts.name}`,
    `📱 ${opts.phoneDisplay}`,
    ``,
    `💬 Muammo:`,
    opts.problem,
    ``,
    `🕐 ${opts.sentAt}`,
    `────────────────────────`,
  ];
  return lines.join("\n").slice(0, 4096);
}

export async function submitLandingSupportMessage(
  _prev: SubmitLandingSupportState | undefined,
  formData: FormData,
): Promise<SubmitLandingSupportState | undefined> {
  const rawPhone = String(formData.get("phone") ?? "");
  const phone998 = normalizeUzbekPhone(rawPhone);
  if (!phone998) return { error: "badphone" };

  const name = sanitizeName(String(formData.get("name") ?? ""));
  if (name.length > NAME_MAX) return { error: "namelong" };

  const raw = String(formData.get("message") ?? "");
  const problem = sanitizeProblem(raw);
  if (!problem) return { error: "empty" };
  if (problem.length < MIN_LEN) return { error: "short" };
  if (problem.length > MAX_LEN) return { error: "long" };

  const settings = await getAdminSiteSettingsRow();
  const chatId = normalizeSupportTelegramChatId(settings.supportTelegramChatId);
  if (!chatId) return { error: "noconfig" };

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return { error: "notoken" };

  const now = new Date();

  const recent = await prisma.publicSupportHelpRequest.findFirst({
    where: { phone: phone998, createdAt: { gt: new Date(now.getTime() - RATE_MIN_MS) } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (recent) return { error: "rate_short" };

  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayCount = await prisma.publicSupportHelpRequest.count({
    where: { phone: phone998, createdAt: { gte: dayAgo } },
  });
  if (dayCount >= RATE_DAY_MAX) return { error: "rate_day" };

  const phoneDisplay = formatPhoneDisplay(phone998);
  const displayName = name || "—";

  const text = buildLandingSupportTelegramText({
    label: sitePublicLabel(),
    name: displayName,
    phoneDisplay,
    problem,
    sentAt: formatNowTashkent(),
  });

  const sent = await sendTelegramPlainToChat(chatId, text);
  if (!sent) return { error: "sendfail" };

  await prisma.publicSupportHelpRequest.create({ data: { phone: phone998 } });

  return { ok: true };
}
