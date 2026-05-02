import crypto from "crypto";

/** https://core.telegram.org/widgets/login#checking-authorization */
export function verifyTelegramLoginQuery(
  searchParams: URLSearchParams,
  botToken: string,
): { id: bigint; username?: string; firstName?: string } | null {
  const hash = searchParams.get("hash");
  if (!hash) return null;

  const pairs: string[] = [];
  searchParams.forEach((value, key) => {
    if (key !== "hash") pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (hmac !== hash) return null;

  const authDate = Number(searchParams.get("auth_date"));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86400) return null;

  const idRaw = searchParams.get("id");
  if (!idRaw || !/^\d+$/.test(idRaw)) return null;

  return {
    id: BigInt(idRaw),
    username: searchParams.get("username") ?? undefined,
    firstName: searchParams.get("first_name") ?? undefined,
  };
}
