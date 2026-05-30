"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeUzbekPhone } from "@/lib/phone";
import { isViloyat } from "@/lib/viloyats";
import { STUDENT_SESSION_COOKIE, signStudentToken } from "@/lib/student-session";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { sessionCookieSecure } from "@/lib/cookie-secure";
import {
  isStudentProfileComplete,
  PROFILE_SETUP_PATH,
} from "@/lib/student-profile";
import { parseStudentGradeFromForm } from "@/lib/student-grade";
import { notifyAdminTeacherRegistrationPending } from "@/lib/telegram-broadcast";
import {
  TEACHER_LOGIN_HOME,
} from "@/lib/user-app-role";

export type AuthFormState = { error?: string } | undefined;

const PASSWORD_MIN = 8;

const PERSON_NAME_MIN = 2;
const PERSON_NAME_MAX = 80;

function normalizeTeacherName(raw: unknown): string {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PERSON_NAME_MAX);
}

export async function registerStudent(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const phoneRaw = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const viloyat = String(formData.get("viloyat") ?? "");
  const asTeacher = formData.get("asTeacher") === "on";
  const grade = parseStudentGradeFromForm(formData.get("gradeLevel"));

  const phone = normalizeUzbekPhone(phoneRaw);
  if (!phone) return { error: "Telefon raqami noto'g'ri. Masalan: +998 90 123 45 67" };
  if (password.length < PASSWORD_MIN) {
    return { error: `Parol kamida ${PASSWORD_MIN} belgi bo'lishi kerak.` };
  }
  if (password !== password2) return { error: "Parollar mos kelmayapti." };
  if (!isViloyat(viloyat)) return { error: "Viloyatni ro'yxatdan tanlang." };
  if (!asTeacher && grade == null) return { error: "Sinfni tanlang (3–9)." };

  let teacherFirstName = "";
  let teacherLastName = "";
  if (asTeacher) {
    teacherFirstName = normalizeTeacherName(formData.get("teacherFirstName"));
    teacherLastName = normalizeTeacherName(formData.get("teacherLastName"));
    if (teacherFirstName.length < PERSON_NAME_MIN) {
      return { error: `Ism kamida ${PERSON_NAME_MIN} belgi bo'lishi kerak.` };
    }
    if (teacherLastName.length < PERSON_NAME_MIN) {
      return { error: `Familiya kamida ${PERSON_NAME_MIN} belgi bo'lishi kerak.` };
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user: { id: string };
  try {
    user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        viloyat,
        gradeLevel: asTeacher ? 0 : (grade as number),
        appUserRole: asTeacher ? "TEACHER" : "STUDENT",
        ...(asTeacher
          ? {
              firstName: teacherFirstName,
              lastName: teacherLastName,
            }
          : {}),
      },
      select: { id: true },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") return { error: "Bu raqam bilan allaqachon ro'yxatdan o'tilgan." };
    return { error: "Ro'yxatdan o'tishda xatolik. Keyinroq urinib ko'ring." };
  }

  if (asTeacher) {
    notifyAdminTeacherRegistrationPending({
      userId: user.id,
      phone,
      viloyat,
      firstName: teacherFirstName,
      lastName: teacherLastName,
    });
  }

  let token: string;
  try {
    token = await signStudentToken(user.id);
  } catch {
    return { error: "STUDENT_SESSION_SECRET sozlanmagan yoki juda qisqa." };
  }

  const jar = await cookies();
  const secure = await sessionCookieSecure();
  jar.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/");
  if (asTeacher) redirect(TEACHER_LOGIN_HOME);
  redirect(PROFILE_SETUP_PATH);
}

export async function loginStudent(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const phoneRaw = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const phone = normalizeUzbekPhone(phoneRaw);
  if (!phone) return { error: "Telefon raqami noto'g'ri." };

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "Raqam yoki parol noto'g'ri." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Raqam yoki parol noto'g'ri." };

  let token: string;
  try {
    token = await signStudentToken(user.id);
  } catch {
    return { error: "STUDENT_SESSION_SECRET sozlanmagan yoki juda qisqa." };
  }

  const jar = await cookies();
  const secure = await sessionCookieSecure();
  jar.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      appUserRole: true,
      firstName: true,
      lastName: true,
      parentPhone: true,
      gradeLevel: true,
    },
  });
  if (profile?.appUserRole === "TEACHER_PENDING") {
    await prisma.user.update({
      where: { id: user.id },
      data: { appUserRole: "TEACHER" },
    });
    redirect(safeTeacherRedirect(formData.get("from")));
  }
  if (profile?.appUserRole === "TEACHER") {
    redirect(safeTeacherRedirect(formData.get("from")));
  }
  if (profile && !isStudentProfileComplete(profile)) {
    redirect(PROFILE_SETUP_PATH);
  }

  redirect(safeStudentRedirect(formData.get("from")));
}

function safeStudentRedirect(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/")) return "/kabinet";
  if (from.startsWith("//") || from.includes("..")) return "/kabinet";
  if (from.startsWith("/kabinet")) return from;
  if (from === PROFILE_SETUP_PATH) return "/kabinet";
  if (/^\/testlar\/[^/]+\/boshlash$/.test(from)) return from;
  return "/kabinet";
}

function safeTeacherRedirect(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/")) return TEACHER_LOGIN_HOME;
  if (from.startsWith("//") || from.includes("..")) return TEACHER_LOGIN_HOME;
  if (from.startsWith("/oqituvchi")) return from;
  return TEACHER_LOGIN_HOME;
}

export type ProfileFormState = { error?: string } | undefined;

const NAME_MIN = 2;
const NAME_MAX = 60;

export async function completeStudentProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getStudentSessionUserId();
  if (!userId) redirect("/auth/kirish");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      appUserRole: true,
      firstName: true,
      lastName: true,
      parentPhone: true,
      gradeLevel: true,
    },
  });
  if (!me) redirect("/auth/kirish");
  if (me.appUserRole === "TEACHER_PENDING" || me.appUserRole === "TEACHER") {
    redirect(TEACHER_LOGIN_HOME);
  }
  if (isStudentProfileComplete(me)) redirect("/kabinet");

  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, NAME_MAX);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, NAME_MAX);
  const parentRaw = String(formData.get("parentPhone") ?? "");

  if (firstName.length < NAME_MIN) return { error: `Ism kamida ${NAME_MIN} belgi bo'lishi kerak.` };
  if (lastName.length < NAME_MIN) return { error: `Familiya kamida ${NAME_MIN} belgi bo'lishi kerak.` };

  const parentPhone = normalizeUzbekPhone(parentRaw);
  const grade = parseStudentGradeFromForm(formData.get("gradeLevel"));
  if (grade == null) return { error: "Sinfni tanlang (3–9-sinf)." };

  if (!parentPhone) {
    return { error: "Ota-ona telefon raqami noto'g'ri. Masalan: +998 90 123 45 67" };
  }
  if (parentPhone === me.phone) {
    return { error: "Ota-ona raqami o'z mobil raqamingiz bilan bir xil bo'lmasligi kerak." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, parentPhone, gradeLevel: grade },
  });

  revalidatePath("/kabinet");
  revalidatePath(PROFILE_SETUP_PATH);
  redirect("/kabinet");
}

export async function logoutStudent() {
  const jar = await cookies();
  jar.delete(STUDENT_SESSION_COOKIE);
  revalidatePath("/");
  redirect("/");
}

export async function createTelegramDeepLinkToken(): Promise<{ url?: string; error?: string }> {
  const userId = await getStudentSessionUserId();
  if (!userId) return { error: "Sessiya topilmadi." };

  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.user.update({
    where: { id: userId },
    data: { telegramLinkToken: token, telegramLinkExpires: expires },
  });

  const url = `https://t.me/prmtestuz_bot?start=${token}`;
  return { url };
}
