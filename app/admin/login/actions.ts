"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieSecure } from "@/lib/cookie-secure";
import { ADMIN_SESSION_COOKIE, signAdminToken } from "@/lib/auth-session";

function safeRedirectPath(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/admin")) return "/admin";
  if (from.startsWith("/admin/login")) return "/admin";
  return from;
}

export async function adminLogin(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = formData.get("password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { error: "ADMIN_PASSWORD sozlanmagan." };
  }
  if (typeof password !== "string" || password !== expected) {
    return { error: "Parol noto'g'ri." };
  }

  let token: string;
  try {
    token = await signAdminToken();
  } catch {
    return { error: "ADMIN_SECRET sozlanmagan yoki juda qisqa (kamida 16 belgi)." };
  }

  const cookieStore = await cookies();
  const secure = await sessionCookieSecure();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: 60 * 60 * 24,
  });

  redirect(safeRedirectPath(formData.get("from")));
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
