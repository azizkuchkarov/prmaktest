import { prisma } from "@/lib/prisma";
import { getStudentSessionUserId } from "@/lib/student-auth";
import type { AppUserRole } from "@prisma/client";

/** Sessiya (User jadvalidagi ro‘yxatdan o‘tgan akkaunt). */
export type SessionPlatformUser = {
  id: string;
  phone: string;
  appUserRole: AppUserRole;
  viloyat: string;
  firstName: string;
  lastName: string;
  parentPhone: string;
  gradeLevel: number;
  balanceSum: number;
};

export async function getSessionPlatformUser(): Promise<SessionPlatformUser | null> {
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
      gradeLevel: true,
      balanceSum: true,
    },
  });
  return row;
}
