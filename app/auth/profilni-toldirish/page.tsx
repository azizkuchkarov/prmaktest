import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/student-auth";
import { isStudentProfileComplete } from "@/lib/student-profile";
import { TEACHER_LOGIN_HOME, TEACHER_PENDING_PATH } from "@/lib/user-app-role";
import { ProfileSetupForm } from "./ui";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (student.appUserRole === "TEACHER_PENDING") redirect(TEACHER_PENDING_PATH);
  if (student.appUserRole === "TEACHER") redirect(TEACHER_LOGIN_HOME);
  if (isStudentProfileComplete(student)) redirect("/kabinet");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
      <h1 className="text-center text-xl font-bold text-slate-900">{"Profilni to'ldiring"}</h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
        <strong>Ism, familiya va sinf</strong> reytingda (shu jumladan sinf bo‘yicha) ko‘rinadi.{" "}
        <strong>Ota-onangiz telefoni</strong> monitoring va hisobotlar uchun ishlatiladi (SMS hozircha
        ixtiyoriy rejimda saqlanadi).
      </p>
      <ProfileSetupForm
        initialFirstName={student.firstName}
        initialLastName={student.lastName}
        initialParentPhone={student.parentPhone}
        initialGradeLevel={student.gradeLevel}
      />
      <p className="mt-6 text-center text-xs text-slate-500">
        {"Ma'lumotlarni keyinroq o'zgartirish keyingi versiyada qo'shiladi."}
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/" className="font-medium text-slate-600 hover:text-slate-900">
          Bosh sahifaga
        </Link>
      </p>
    </div>
  );
}
