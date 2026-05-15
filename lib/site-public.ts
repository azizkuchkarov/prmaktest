/**
 * Sayt manzili (havolalar). `.env`: NEXT_PUBLIC_APP_URL=https://testpm.uz
 */
export function sitePublicOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "https://testpm.uz").trim();
  return raw.replace(/\/+$/, "");
}

/**
 * Telegram va UI matnlarida ko‘rinadigan brend.
 * `.env`: NEXT_PUBLIC_SITE_LABEL=testpm.uz
 */
export function sitePublicLabel(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_LABEL || "testpm.uz").trim();
  return raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}
