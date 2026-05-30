import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/student-auth";
import { isTeacherRole } from "@/lib/user-app-role";

export const dynamic = "force-dynamic";

/** O‘qituvchi asosiy paneli — STUDENT va boshqa rollar yo‘naltiriladi. */
export default async function OqituvchiTeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentStudent();
  if (!u) redirect("/auth/kirish");
  if (u.appUserRole === "STUDENT") redirect("/kabinet");
  if (!isTeacherRole(u.appUserRole)) redirect("/auth/kirish");

  return children;
}
