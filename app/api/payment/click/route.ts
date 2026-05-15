import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clickSignComplete, clickSignPrepare, timingSafeEqualHex } from "@/lib/click-sign";

export const dynamic = "force-dynamic";

function clickJson(record: Record<string, string | number>) {
  return NextResponse.json(record, { headers: { "Content-Type": "application/json; charset=utf-8" } });
}

async function readClickParams(request: NextRequest): Promise<Record<string, string>> {
  const raw = await request.text();
  const trimmed = raw.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("{")) {
    try {
      const j = JSON.parse(trimmed) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, v == null ? "" : String(v)]));
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(trimmed));
}

/**
 * CLICK Merchant API: Prepare (action=0) va Complete (action=1).
 * CLICK kabinetida “Prepare URL / Complete URL” sifatida qo‘ying: `https://<domen>/api/payment/click`
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CLICK_SECRET_KEY?.trim();
  const serviceIdEnv = process.env.CLICK_SERVICE_ID?.trim();
  if (!secret || !serviceIdEnv) {
    console.error("[click] CLICK_SECRET_KEY yoki CLICK_SERVICE_ID sozlanmagan");
    return clickJson({ error: -8, error_note: "not_configured" });
  }

  let body: Record<string, string>;
  try {
    body = await readClickParams(request);
  } catch {
    return clickJson({ error: -8, error_note: "bad_request" });
  }

  const clickTransId = body.click_trans_id ?? "";
  const serviceId = body.service_id ?? "";
  const merchantTransId = body.merchant_trans_id ?? "";
  const amountRaw = body.amount ?? "0";
  const action = Number(body.action);
  const signTime = body.sign_time ?? "";
  const signString = (body.sign_string ?? "").toLowerCase();
  const clickPaydocId = body.click_paydoc_id ?? "";

  if (!clickTransId || !serviceId || !merchantTransId || !signTime || !signString) {
    return clickJson({ error: -8, error_note: "missing_fields" });
  }

  if (serviceId !== serviceIdEnv) {
    return clickJson({ error: -8, error_note: "service_mismatch" });
  }

  if (action === 0) {
    const expected = clickSignPrepare(clickTransId, serviceId, secret, merchantTransId, amountRaw, 0, signTime);
    if (!timingSafeEqualHex(expected, signString)) {
      console.warn("[click] prepare sign xato");
      return clickJson({ error: -1, error_note: "invalid_sign" });
    }

    const amountInt = Math.round(Number(amountRaw));
    if (!Number.isFinite(amountInt) || amountInt <= 0) {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        error: -2,
        error_note: "invalid_amount",
      });
    }

    const deposit = await prisma.balanceDeposit.findFirst({
      where: { id: merchantTransId },
    });

    if (!deposit) {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        error: -5,
        error_note: "order_not_found",
      });
    }

    if (deposit.amountSum !== amountInt) {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        error: -2,
        error_note: "amount_mismatch",
      });
    }

    if (deposit.status === "COMPLETED") {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: deposit.prepareSeq,
        error: 0,
        error_note: "Success",
      });
    }

    if (deposit.status === "CANCELLED") {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        error: -9,
        error_note: "cancelled",
      });
    }

    await prisma.balanceDeposit.update({
      where: { id: deposit.id },
      data: { clickTransId: clickTransId },
    });

    return clickJson({
      click_trans_id: clickTransId,
      merchant_trans_id: merchantTransId,
      merchant_prepare_id: deposit.prepareSeq,
      error: 0,
      error_note: "Success",
    });
  }

  if (action === 1) {
    const merchantPrepareId = body.merchant_prepare_id ?? "";
    const completeError = Number(body.error ?? 0);

    const expected = clickSignComplete(
      clickTransId,
      serviceId,
      secret,
      merchantTransId,
      merchantPrepareId,
      amountRaw,
      1,
      signTime,
    );
    if (!timingSafeEqualHex(expected, signString)) {
      console.warn("[click] complete sign xato");
      return clickJson({ error: -1, error_note: "invalid_sign" });
    }

    const deposit = await prisma.balanceDeposit.findFirst({
      where: { id: merchantTransId },
    });

    if (!deposit) {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        error: -5,
        error_note: "order_not_found",
      });
    }

    if (Number(deposit.prepareSeq) !== Number(merchantPrepareId)) {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        error: -6,
        error_note: "prepare_mismatch",
      });
    }

    const amountInt = Math.round(Number(amountRaw));
    if (deposit.amountSum !== amountInt) {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        error: -2,
        error_note: "amount_mismatch",
      });
    }

    if (deposit.status === "COMPLETED") {
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: deposit.prepareSeq,
        error: 0,
        error_note: "Success",
      });
    }

    if (completeError < 0) {
      await prisma.balanceDeposit.update({
        where: { id: deposit.id },
        data: { status: "CANCELLED", clickTransId: clickTransId },
      });
      return clickJson({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: deposit.prepareSeq,
        error: 0,
        error_note: "Success",
      });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: deposit.userId },
        data: { balanceSum: { increment: deposit.amountSum } },
      }),
      prisma.balanceDeposit.update({
        where: { id: deposit.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          clickTransId: clickTransId || clickPaydocId || deposit.clickTransId,
        },
      }),
    ]);

    return clickJson({
      click_trans_id: clickTransId,
      merchant_trans_id: merchantTransId,
      merchant_confirm_id: deposit.prepareSeq,
      error: 0,
      error_note: "Success",
    });
  }

  return clickJson({ error: -8, error_note: "unknown_action" });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "click-merchant-callback" }, { status: 200 });
}
