"use server";

import { prisma } from "@/lib/prisma";
import { getStudentSessionUserId } from "@/lib/student-auth";

const MIN_SUM = 1_000;
const MAX_SUM = 50_000_000;

function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");
  return u && u.length > 0 ? u : "http://localhost:3000";
}

export type ClickTopUpResult =
  | { ok: true; url: string }
  | { ok: false; error: "auth" | "click_not_configured" | "invalid_amount" };

/**
 * CLICK to‘lov sahifasiga yo‘naltirish URLi (transaction_param = BalanceDeposit.id).
 * `.env` da CLICK_MERCHANT_ID, CLICK_SERVICE_ID, CLICK_SECRET_KEY bo‘lishi kerak.
 */
export async function createClickTopUpSession(amountSum: number): Promise<ClickTopUpResult> {
  const userId = await getStudentSessionUserId();
  if (!userId) return { ok: false, error: "auth" };

  const merchantId = process.env.CLICK_MERCHANT_ID?.trim();
  const serviceId = process.env.CLICK_SERVICE_ID?.trim();
  const secret = process.env.CLICK_SECRET_KEY?.trim();
  if (!merchantId || !serviceId || !secret) {
    return { ok: false, error: "click_not_configured" };
  }

  const amt = Math.round(Number(amountSum));
  if (!Number.isFinite(amt) || amt < MIN_SUM || amt > MAX_SUM) {
    return { ok: false, error: "invalid_amount" };
  }

  const deposit = await prisma.balanceDeposit.create({
    data: { userId, amountSum: amt },
  });

  const origin = appOrigin();
  const params = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: amt.toFixed(2),
    transaction_param: deposit.id,
    return_url: `${origin}/kabinet`,
  });

  const merchantUserId = process.env.CLICK_MERCHANT_USER_ID?.trim();
  if (merchantUserId) {
    params.set("merchant_user_id", merchantUserId);
  }

  return { ok: true, url: `https://my.click.uz/services/pay?${params.toString()}` };
}
