import { getCurrentStudent } from "@/lib/student-auth";
import { formatPhoneDisplay } from "@/lib/phone";
import { studentDisplayName } from "@/lib/student-profile";
import { TeacherPremiumShell } from "@/components/teacher/TeacherPremiumShell";
import { getTeacherVirtualSinflarNewCount } from "@/lib/virtual-class-new";

export default async function OqituvchiRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentStudent();

  if (!u || (u.appUserRole !== "TEACHER" && u.appUserRole !== "TEACHER_PENDING")) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-slate-100 to-slate-200/80 text-slate-900">
        {children}
      </div>
    );
  }

  const displayName =
    studentDisplayName({
      firstName: u.firstName,
      lastName: u.lastName,
      parentPhone: u.parentPhone,
      gradeLevel: u.gradeLevel,
    }).trim() || formatPhoneDisplay(u.phone);

  const virtualSinflarNewCount =
    u.appUserRole === "TEACHER" ? await getTeacherVirtualSinflarNewCount(u.id) : 0;

  return (
    <TeacherPremiumShell
      displayName={displayName}
      viloyat={u.viloyat}
      phoneDisplay={formatPhoneDisplay(u.phone)}
      roleBadge={u.appUserRole === "TEACHER_PENDING" ? "pending" : "teacher"}
      virtualSinflarNewCount={virtualSinflarNewCount}
    >
      {children}
    </TeacherPremiumShell>
  );
}
