import { getCurrentStudent } from "@/lib/student-auth";
import { formatPhoneDisplay } from "@/lib/phone";
import { studentDisplayName } from "@/lib/student-profile";
import { TeacherPremiumShell } from "@/components/teacher/TeacherPremiumShell";
import { getTeacherVirtualSinflarNewCount } from "@/lib/virtual-class-new";
import { isTeacherRole } from "@/lib/user-app-role";

export default async function OqituvchiRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentStudent();

  if (!u || !isTeacherRole(u.appUserRole)) {
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

  const virtualSinflarNewCount = await getTeacherVirtualSinflarNewCount(u.id);

  return (
    <TeacherPremiumShell
      displayName={displayName}
      viloyat={u.viloyat}
      phoneDisplay={formatPhoneDisplay(u.phone)}
      roleBadge="teacher"
      virtualSinflarNewCount={virtualSinflarNewCount}
    >
      {children}
    </TeacherPremiumShell>
  );
}
