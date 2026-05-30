import { RegisterIntroFlow } from "@/components/auth/RegisterIntroFlow";
import { TEACHER_REGISTER_INTRO } from "@/components/auth/register-intro-content";

export const dynamic = "force-dynamic";

export default function TeacherRegisterPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <RegisterIntroFlow
        variant="teacher"
        heading="O‘qituvchi sifatida ro‘yxatdan o‘tish"
        lead="Virtual sinflar, o‘quvchilarni boshqarish va reyting imkoniyatlari bilan tanishing."
        steps={TEACHER_REGISTER_INTRO}
      />
    </div>
  );
}
