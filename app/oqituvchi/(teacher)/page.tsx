import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTeacherDashboardPayload } from "@/lib/teacher-dashboard";
import { requireTeacherSessionId } from "@/lib/teacher-auth";
import { VIRTUAL_CLASS_PREP_BLOCKS } from "@/lib/virtual-class-prep-grade";
import { TeacherDashboardPanel } from "@/components/teacher/TeacherDashboardPanel";
import { createVirtualClassForm } from "./actions";

export const dynamic = "force-dynamic";

type Search = Promise<{ clsErr?: string; hint?: string }>;

export default async function TeacherHomePage(props: { searchParams: Search }) {
  const q = await props.searchParams;
  const teacherId = await requireTeacherSessionId();
  const dashboard = await getTeacherDashboardPayload(teacherId);

  let clsErrBanner: string | null = null;
  if (q.clsErr === "prep_invalid") clsErrBanner = "Tayyorlov sinfini tanlang (4-sinf yoki 5–9-sinf bloki).";
  if (q.clsErr === "tuman_short" || q.clsErr === "markaz_short")
    clsErrBanner = "Markaz nomi kamida 2 belgi bo‘lishi kerak.";
  if (q.clsErr === "course_short") clsErrBanner = "Kurs nomi kamida 2 belgi bo‘lishi kerak.";

  const hintSuccess = q.hint === "created";

  const cardCls =
    "rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-indigo-950/[0.05] backdrop-blur-sm ring-1 ring-slate-200/55";

  return (
    <div className="space-y-8 sm:space-y-10">
      {hintSuccess ? (
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 px-5 py-3.5 text-sm font-medium text-emerald-950 ring-1 ring-emerald-200/70">
          Virtual sinf qo‘shildi —{" "}
          <Link href="/oqituvchi/sinfxonalar" className="font-bold text-emerald-900 underline underline-offset-2">
            Sinfxonalar
          </Link>{" "}
          sahifasidan boshqaring.
        </div>
      ) : null}

      {clsErrBanner ? (
        <p className="rounded-2xl border border-amber-200/85 bg-gradient-to-br from-amber-50 to-white px-5 py-3.5 text-sm font-medium text-amber-950 ring-1 ring-amber-300/65">
          {clsErrBanner}
        </p>
      ) : null}

      <TeacherDashboardPanel data={dashboard} />

      <section className={cardCls}>
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <Plus className="size-5" aria-hidden />
          </span>
          Yangi virtual sinf
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Avval tayyorlov sinfini tanlang — keyin markaz va sinfxona nomi. Katalog faqat shu blokdagi testlarni ko‘rsatadi.
        </p>
        <form action={createVirtualClassForm} className="mt-6 max-w-xl space-y-5">
          <fieldset className="space-y-3 rounded-2xl border border-indigo-100/90 bg-indigo-50/30 p-4 ring-1 ring-indigo-100/80">
            <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
              Tayyorlov sinfi
            </legend>
            {VIRTUAL_CLASS_PREP_BLOCKS.map((block, i) => (
              <label
                key={block.value}
                className="flex cursor-pointer gap-3 rounded-xl border border-slate-200/90 bg-white/90 p-3.5 shadow-sm transition has-[:checked]:border-indigo-400 has-[:checked]:ring-2 has-[:checked]:ring-indigo-100"
              >
                <input
                  type="radio"
                  name="prepBlock"
                  value={block.value}
                  required
                  defaultChecked={i === 0}
                  className="mt-1 size-4 shrink-0 accent-indigo-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{block.label}</span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-slate-600">{block.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div>
            <label htmlFor="markaz" className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Markaz
            </label>
            <input
              id="markaz"
              name="tuman"
              required
              minLength={2}
              maxLength={120}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200/90 bg-white/90 px-4 text-sm outline-none shadow-inner ring-2 ring-transparent transition focus:border-indigo-400 focus:ring-indigo-100"
              placeholder="Masalan: Yunusobod PM markazi"
            />
          </div>
          <div>
            <label htmlFor="courseName" className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Tayyorlov kursi / sinf nomi
            </label>
            <input
              id="courseName"
              name="courseName"
              required
              minLength={2}
              maxLength={160}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200/90 bg-white/90 px-4 text-sm outline-none shadow-inner ring-2 ring-transparent transition focus:border-indigo-400 focus:ring-indigo-100"
              placeholder="Masalan: 5-sinf tayyori"
            />
          </div>
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-[1.05] active:scale-[0.99] sm:w-auto"
          >
            Sinf yaratish
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </form>
      </section>
    </div>
  );
}
