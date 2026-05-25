import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-session";
import { STUDENT_SESSION_COOKIE } from "@/lib/student-session";

async function studentAuthResponse(request: NextRequest): Promise<NextResponse | null> {
  const studentSecret = process.env.STUDENT_SESSION_SECRET;
  if (!studentSecret || studentSecret.length < 16) {
    return NextResponse.redirect(new URL("/auth/kirish?misconfigured=1", request.url));
  }

  const st = request.cookies.get(STUDENT_SESSION_COOKIE)?.value;
  if (!st) {
    const url = new URL("/auth/kirish", request.url);
    url.searchParams.set("from", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(st, new TextEncoder().encode(studentSecret));
    if (payload.typ !== "student" || typeof payload.sub !== "string") {
      throw new Error("invalid_student_token");
    }
    return null;
  } catch {
    const url = new URL("/auth/kirish", request.url);
    url.searchParams.set("from", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || adminSecret.length < 16) {
      return NextResponse.redirect(new URL("/admin/login?misconfigured=1", request.url));
    }

    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!adminToken) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    try {
      await jwtVerify(adminToken, new TextEncoder().encode(adminSecret));
      return NextResponse.next();
    } catch {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/kabinet")) {
    const block = await studentAuthResponse(request);
    if (block) return block;
    return NextResponse.next();
  }

  if (pathname.startsWith("/oqituvchi")) {
    const block = await studentAuthResponse(request);
    if (block) return block;
    return NextResponse.next();
  }

  if (/^\/testlar\/[^/]+\/boshlash$/.test(pathname)) {
    const block = await studentAuthResponse(request);
    if (block) return block;
    return NextResponse.next();
  }

  if (pathname.startsWith("/turnirlar")) {
    const block = await studentAuthResponse(request);
    if (block) return block;
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/kabinet/:path*",
    "/oqituvchi",
    "/oqituvchi/:path*",
    "/testlar/:testId/boshlash",
    "/turnirlar/:path*",
  ],
};
