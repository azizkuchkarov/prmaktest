import { SignJWT, jwtVerify } from "jose";

export const STUDENT_SESSION_COOKIE = "student_session";
const TTL_SEC = 60 * 60 * 24 * 30; // 30 kun

function getSecret(): Uint8Array {
  const s = process.env.STUDENT_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("STUDENT_SESSION_SECRET kamida 16 belgi bo'lishi kerak.");
  }
  return new TextEncoder().encode(s);
}

export async function signStudentToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, typ: "student" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SEC}s`)
    .sign(getSecret());
}

export async function verifyStudentToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== "student" || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}
