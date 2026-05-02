import { SignJWT, jwtVerify } from "jose";

const COOKIE = "admin_session";
const DAY = 60 * 60 * 24;

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SECRET muhit o'zgaruvchisi o'rnatilmagan yoki juda qisqa.");
  }
  return new TextEncoder().encode(s);
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DAY}s`)
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export { COOKIE as ADMIN_SESSION_COOKIE };
