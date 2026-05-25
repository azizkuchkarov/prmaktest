import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/student-auth";
import { TEACHER_PENDING_PATH } from "@/lib/user-app-role";

export const dynamic = "force-dynamic";

/** Faqat tasdiqlangan o‘qituvchi: `/oqituvchi` asosiy sahifa. */
export default async function OqituvchiTeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentStudent();
  if (!u) redirect("/auth/kirish");
  if (u.appUserRole === "STUDENT") redirect("/kabinet");
  if (u.appUserRole === "TEACHER_PENDING") redirect(TEACHER_PENDING_PATH);
  if (u.appUserRole !== "TEACHER") redirect("/auth/kirish");

  return children;
}
