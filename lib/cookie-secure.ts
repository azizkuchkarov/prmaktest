import { headers } from "next/headers";

/**
 * Session cookie `secure` bayrog‘i.
 * Production + HTTP: `secure: true` bo‘lsa brauzer cookie’ni inkor qiladi — kirish/profil sikli.
 * Nginx SSL terminatsiyasi bo‘lsa odatda `x-forwarded-proto: https` yuboriladi.
 */
export async function sessionCookieSecure(): Promise<boolean> {
  const h = await headers();
  const raw = h.get("x-forwarded-proto");
  const proto = raw?.split(",")[0]?.trim().toLowerCase();
  if (proto === "https") return true;
  if (proto === "http") return false;

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (base.startsWith("https://")) return true;
  if (base.startsWith("http://")) return false;

  // Aniq emas: developmentda har doim false; productionda to‘g‘ridan-to‘g‘ri HTTP Node ham mumkin
  return process.env.NODE_ENV !== "production";
}
