import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { isTeacherRole } from "@/lib/user-app-role";

/** O‘qituvchi sessiyasi — TEACHER yoki eski TEACHER_PENDING (avtomatik TEACHER ga yangilanadi). */
export async function requireTeacherSessionId(): Promise<string> {
  const id = await getStudentSessionUserId();
  if (!id) redirect("/auth/kirish");

  const u = await prisma.user.findUnique({
    where: { id },
    select: { appUserRole: true },
  });
  if (!u || !isTeacherRole(u.appUserRole)) redirect("/auth/kirish");

  if (u.appUserRole === "TEACHER_PENDING") {
    await prisma.user.update({
      where: { id },
      data: { appUserRole: "TEACHER" },
    });
  }

  return id;
}
