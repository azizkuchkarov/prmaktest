import { cookies } from "next/headers";
import type { AppUserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STUDENT_SESSION_COOKIE, verifyStudentToken } from "@/lib/student-session";

export async function getStudentSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyStudentToken(token);
}

/** O‘quvchi sessiyasi bo‘yicha profil. */
export type CurrentStudent = {
  id: string;
  phone: string;
  appUserRole: AppUserRole;
  viloyat: string;
  firstName: string;
  lastName: string;
  parentPhone: string;
  telegramId: bigint | null;
  telegramUsername: string | null;
  telegramLinkedAt: Date | null;
  createdAt: Date;
  balanceSum: number;
  gradeLevel: number;
};

export async function getCurrentStudent(): Promise<CurrentStudent | null> {
  const id = await getStudentSessionUserId();
  if (!id) return null;
  const row = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      phone: true,
      appUserRole: true,
      viloyat: true,
      firstName: true,
      lastName: true,
      parentPhone: true,
      telegramId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
      createdAt: true,
      balanceSum: true,
      gradeLevel: true,
    },
  });
  if (!row) return null;
  return row;
}
