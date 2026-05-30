import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/student-auth";
import { TEACHER_LOGIN_HOME, isTeacherRole } from "@/lib/user-app-role";

export const dynamic = "force-dynamic";

/** Eski «kutilmoqda» havolasi — o‘qituvchini to‘g‘ridan-to‘g‘ri kabinetga yo‘naltiradi. */
export default async function OqituvchiKutilmoqdaPage() {
  const u = await getCurrentStudent();
  if (!u) redirect("/auth/kirish");
  if (u.appUserRole === "STUDENT") redirect("/kabinet");
  if (isTeacherRole(u.appUserRole)) redirect(TEACHER_LOGIN_HOME);
  redirect("/auth/kirish");
}
