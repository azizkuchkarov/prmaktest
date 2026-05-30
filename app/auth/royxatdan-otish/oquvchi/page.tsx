import { RegisterIntroFlow } from "@/components/auth/RegisterIntroFlow";
import { STUDENT_REGISTER_INTRO } from "@/components/auth/register-intro-content";

export const dynamic = "force-dynamic";

export default function StudentRegisterPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <RegisterIntroFlow
        variant="student"
        heading="O‘quvchi sifatida ro‘yxatdan o‘tish"
        lead="Platformada testlar, reyting va turnirlar qanday ishlashini qisqacha tanishing."
        steps={STUDENT_REGISTER_INTRO}
      />
    </div>
  );
}
