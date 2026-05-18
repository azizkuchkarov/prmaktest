"use server";

import { revalidatePath } from "next/cache";
import { getAdminSiteSettingsRow, normalizeSupportTelegramChatId } from "@/lib/admin-site-settings";
import { formatPhoneDisplay } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { sitePublicLabel } from "@/lib/site-public";
import { getCurrentStudent } from "@/lib/student-auth";
import { studentDisplayName } from "@/lib/student-profile";
import { sendTelegramPlainToChat } from "@/lib/telegram-broadcast";

const MIN_LEN = 15;
const MAX_LEN = 2000;
const RATE_MIN_MS = 120_000;
const RATE_DAY_MAX = 8;

export type SubmitKabinetSupportState =
  | undefined
  | {
      ok?: boolean;
      error?:
        | "auth"
        | "empty"
        | "short"
        | "long"
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

function formatNowTashkent(): string {
  return new Date().toLocaleString("uz-UZ", {
    timeZone: "Asia/Tashkent",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildAdminSupportTelegramText(opts: {
  label: string;
  displayName: string;
  phoneDisplay: string;
  viloyat: string;
  userId: string;
  telegramLine: string;
  problem: string;
  sentAt: string;
}): string {
  const lines = [
    `🆘 24/7 YORDAM — ${opts.label}`,
    `────────────────────────`,
    `👤 ${opts.displayName}`,
    `📱 ${opts.phoneDisplay}`,
    `📍 ${opts.viloyat}`,
    `🆔 ${opts.userId}`,
    opts.telegramLine,
    ``,
    `💬 Muammo:`,
    opts.problem,
    ``,
    `🕐 ${opts.sentAt}`,
    `────────────────────────`,
  ];
  return lines.join("\n").slice(0, 4096);
}

export async function submitKabinetSupportMessage(
  _prev: SubmitKabinetSupportState | undefined,
  formData: FormData,
): Promise<SubmitKabinetSupportState | undefined> {
  const student = await getCurrentStudent();
  if (!student) return { error: "auth" };

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

  const recent = await prisma.supportHelpRequest.findFirst({
    where: { userId: student.id, createdAt: { gt: new Date(now.getTime() - RATE_MIN_MS) } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (recent) return { error: "rate_short" };

  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayCount = await prisma.supportHelpRequest.count({
    where: { userId: student.id, createdAt: { gte: dayAgo } },
  });
  if (dayCount >= RATE_DAY_MAX) return { error: "rate_day" };

  const displayName = studentDisplayName(student) || "—";
  const phoneDisplay = formatPhoneDisplay(student.phone);
  const tg =
    student.telegramUsername != null && student.telegramUsername.trim() !== ""
      ? `✈️ @${student.telegramUsername.trim()}`
      : student.telegramId != null
        ? `✈️ TG id: ${String(student.telegramId)}`
        : `✈️ Telegram: ulanmagan`;

  const text = buildAdminSupportTelegramText({
    label: sitePublicLabel(),
    displayName,
    phoneDisplay,
    viloyat: student.viloyat,
    userId: student.id,
    telegramLine: tg,
    problem,
    sentAt: formatNowTashkent(),
  });

  const sent = await sendTelegramPlainToChat(chatId, text);
  if (!sent) return { error: "sendfail" };

  await prisma.supportHelpRequest.create({ data: { userId: student.id } });

  revalidatePath("/kabinet");
  return { ok: true };
}
