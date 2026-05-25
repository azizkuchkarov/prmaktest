import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentStudent } from "@/lib/student-auth";
import { TEACHER_LOGIN_HOME } from "@/lib/user-app-role";

export const dynamic = "force-dynamic";

export default async function OqituvchiKutilmoqdaPage() {
  const u = await getCurrentStudent();
  if (!u) redirect("/auth/kirish");

  if (u.appUserRole === "STUDENT") redirect("/kabinet");
  if (u.appUserRole === "TEACHER") redirect(TEACHER_LOGIN_HOME);
  if (u.appUserRole !== "TEACHER_PENDING") redirect("/auth/kirish");

  const steps = [
    "Bizning qoʻllab‑quvvatlash guruhimiz Telegram orqali xabardor boʻladi.",
    "Admin akkauntingizni tasdiqlaydi — koʻpincha bir necha soat ichida.",
    "So‘ng siz toʻliq kabinet ochasiz va istalgan miqdorda virtual sinfxonalar yaratasiz.",
  ];

  return (
    <div className="mx-auto max-w-lg">
      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/80 bg-white/80 p-[1px] shadow-2xl shadow-indigo-950/15 backdrop-blur-md ring-1 ring-slate-200/65">
        <div className="rounded-[calc(1.85rem-1px)] bg-gradient-to-b from-white to-slate-50/98 px-7 py-10 sm:px-10 sm:py-11">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/35 ring-8 ring-amber-100/65">
            <ShieldCheck className="size-8" aria-hidden />
          </div>
          <h1 className="mt-7 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
            Tasdiqlash navbatida
          </h1>
          <p className="mt-3 text-center text-[15px] leading-relaxed text-slate-600">
            Juda tez javob beramiz. Status o‘zgargach sahifani yangilang — yoki tizimga qayta kiring va avtomatik
            yangi kabinet ochiladi.
          </p>

          <ul className="mt-10 space-y-4">
            {steps.map((s, i) => (
              <li
                key={s}
                className="flex gap-4 rounded-2xl border border-slate-100/95 bg-white/95 px-4 py-4 shadow-sm shadow-indigo-950/[0.02] ring-1 ring-slate-100/85"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white tabular-nums shadow-md shadow-indigo-400/35">
                  {i + 1}
                </span>
                <p className="min-w-0 pt-2 text-[14px] leading-snug text-slate-700">{s}</p>
              </li>
            ))}
          </ul>

          <p className="mt-10 flex justify-center gap-2 text-[13px] text-slate-500">
            <Sparkles className="size-4 shrink-0 text-amber-500" aria-hidden />
            Tekshiruv bepul · hech qanday qoʻshimcha hujjat shart emas
          </p>

          <p className="mt-8 border-t border-slate-100 pt-8 text-center">
            <Link
              href="/"
              className="text-sm font-bold text-indigo-700 underline-offset-4 transition hover:text-indigo-950 hover:underline"
            >
              Sayt bosh sahifasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
