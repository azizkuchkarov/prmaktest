import crypto from "node:crypto";

/** CLICK hujjatlariga mos: summani imzo uchun "N.NN" qator */
export function clickAmountToSignString(amount: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "0.00";
  return n.toFixed(2);
}

/** Prepare: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time) */
export function clickSignPrepare(
  clickTransId: string,
  serviceId: string,
  secretKey: string,
  merchantTransId: string,
  amount: string | number,
  action: string | number,
  signTime: string,
): string {
  const amountStr = clickAmountToSignString(amount);
  const raw = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${amountStr}${action}${signTime}`;
  return crypto.createHash("md5").update(raw, "utf8").digest("hex");
}

/**
 * Complete:
 * md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
 */
export function clickSignComplete(
  clickTransId: string,
  serviceId: string,
  secretKey: string,
  merchantTransId: string,
  merchantPrepareId: string | number,
  amount: string | number,
  action: string | number,
  signTime: string,
): string {
  const amountStr = clickAmountToSignString(amount);
  const raw = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${merchantPrepareId}${amountStr}${action}${signTime}`;
  return crypto.createHash("md5").update(raw, "utf8").digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
