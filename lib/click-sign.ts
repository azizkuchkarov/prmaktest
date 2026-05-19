import crypto from "node:crypto";

/** CLICK hujjatlariga mos: summani imzo uchun "N.NN" qator */
export function clickAmountToSignString(amount: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "0.00";
  return n.toFixed(2);
}

/**
 * CLICK ba'zan summani "10000", "10000.0", "10000.00" ko'rinishida yuboradi; imzo aynan bitta shaklda.
 * Shu sababli tekshiruvda bir nechta normalizatsiyani sinaymiz.
 */
export function clickAmountVariantsForSign(amountRaw: string): string[] {
  const raw = amountRaw.trim().replace(",", ".");
  const variants = new Set<string>();
  if (raw.length > 0) variants.add(raw);
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) {
    variants.add(n.toFixed(2));
    if (Number.isInteger(n)) {
      variants.add(String(n));
      variants.add(`${n}.0`);
    }
  }
  if (variants.size === 0) variants.add("0.00");
  return [...variants];
}

function merchantPrepareIdVariants(id: string): string[] {
  const s = id.trim();
  const variants = new Set<string>();
  if (s.length > 0) variants.add(s);
  const n = Number(s);
  if (Number.isFinite(n) && Number.isInteger(n)) variants.add(String(n));
  return variants.size > 0 ? [...variants] : [""];
}

function md5PrepareChain(
  clickTransId: string,
  serviceId: string,
  secretKey: string,
  merchantTransId: string,
  /** Imzo qatorida aynan shunday qo'shilishi kerak (masalan "10000" yoki "10000.00") */
  amountLiteral: string,
  action: string | number,
  signTime: string,
): string {
  const raw = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${amountLiteral}${action}${signTime}`;
  return crypto.createHash("md5").update(raw, "utf8").digest("hex");
}

function md5CompleteChain(
  clickTransId: string,
  serviceId: string,
  secretKey: string,
  merchantTransId: string,
  merchantPrepareIdLiteral: string,
  amountLiteral: string,
  action: string | number,
  signTime: string,
): string {
  const raw = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${merchantPrepareIdLiteral}${amountLiteral}${action}${signTime}`;
  return crypto.createHash("md5").update(raw, "utf8").digest("hex");
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
  return md5PrepareChain(
    clickTransId,
    serviceId,
    secretKey,
    merchantTransId,
    clickAmountToSignString(amount),
    action,
    signTime,
  );
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
  return md5CompleteChain(
    clickTransId,
    serviceId,
    secretKey,
    merchantTransId,
    String(merchantPrepareId),
    clickAmountToSignString(amount),
    action,
    signTime,
  );
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

/** Prepare uchun sign_string tekshiruvi (summa formatlari farq qilishi mumkin). */
export function verifyClickPrepareSign(
  clickTransId: string,
  serviceId: string,
  secretKey: string,
  merchantTransId: string,
  amountRaw: string,
  action: number,
  signTime: string,
  signStringLower: string,
): boolean {
  for (const amt of clickAmountVariantsForSign(amountRaw)) {
    const h = md5PrepareChain(clickTransId, serviceId, secretKey, merchantTransId, amt, action, signTime);
    if (timingSafeEqualHex(h, signStringLower)) return true;
  }
  return false;
}

/** Complete uchun sign_string tekshiruvi. */
export function verifyClickCompleteSign(
  clickTransId: string,
  serviceId: string,
  secretKey: string,
  merchantTransId: string,
  merchantPrepareIdRaw: string,
  amountRaw: string,
  action: number,
  signTime: string,
  signStringLower: string,
): boolean {
  for (const prep of merchantPrepareIdVariants(merchantPrepareIdRaw)) {
    for (const amt of clickAmountVariantsForSign(amountRaw)) {
      const h = md5CompleteChain(
        clickTransId,
        serviceId,
        secretKey,
        merchantTransId,
        prep,
        amt,
        action,
        signTime,
      );
      if (timingSafeEqualHex(h, signStringLower)) return true;
    }
  }
  return false;
}
