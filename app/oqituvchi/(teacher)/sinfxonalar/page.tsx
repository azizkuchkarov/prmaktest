import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, School } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { virtualClassPrepGradeLabel } from "@/lib/virtual-class-prep-grade";
import { countTeacherClassPendingNews } from "@/lib/virtual-class-new";
import { NewsStatusBadge } from "@/components/news/NewsStatusBadge";

export const dynamic = "force-dynamic";

async function teacherIdStrict(): Promise<string> {
  const id = await getStudentSessionUserId();
  if (!id) redirect("/auth/kirish");
  const row = await prisma.user.findUnique({
    where: { id },
    select: { appUserRole: true },
  });
  if (row?.appUserRole !== "TEACHER") redirect("/auth/kirish");
  return id;
}

const cardCls =
  "rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-indigo-950/[0.05] backdrop-blur-sm ring-1 ring-slate-200/55";

export default async function TeacherSinfxonalarPage() {
  const teacherId = await teacherIdStrict();

  const rows = await prisma.virtualClass.findMany({
    where: { teacherUserId: teacherId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      tuman: true,
      courseName: true,
      prepGradeLevel: true,
      updatedAt: true,
      teacherActivitySeenAt: true,
      members: {
        where: { status: "AWAITING_TEACHER" },
        select: { status: true, updatedAt: true },
      },
      _count: {
        select: {
          members: true,
          assignedTests: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      <nav aria-label="Navigatsiya zanjiri" className="flex flex-wrap items-center gap-1 text-[13px] font-medium">
        <Link
          href="/oqituvchi"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/70 px-3 py-1.5 text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-white hover:text-indigo-900"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Bosh sahifa
        </Link>
      </nav>

      <section className={`${cardCls} min-w-0`}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100/90 pb-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Sizning sinfxonalaringiz</h1>
            <p className="mt-1 text-sm text-slate-600">Har biri uchun alohida boshqaruv va statistika.</p>
          </div>
          <Link
            href="/oqituvchi"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-900 shadow-sm transition hover:bg-indigo-100"
          >
            Yangi virtual sinf
            <School className="size-3.5 opacity-80" aria-hidden />
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 py-10 text-center">
            <div className="mx-auto flex max-w-[17rem] flex-col items-center rounded-3xl border border-dashed border-slate-300/90 bg-slate-50/50 px-8 py-10">
              <BookOpen className="size-11 text-indigo-300" aria-hidden />
              <p className="mt-5 text-[15px] font-semibold text-slate-800">Sinf hali yoʻq</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Bosh sahifadan birinchi virtual sinfni yarating — keyin shu yerda chiqadi.
              </p>
              <Link
                href="/oqituvchi"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105"
              >
                Bosh sahifaga o‘tish
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => {
              const pendingNew = countTeacherClassPendingNews(r);
              return (
              <li key={r.id}>
                <Link
                  href={`/oqituvchi/sinflar/${r.id}`}
                  className="group flex items-center gap-4 rounded-[1.35rem] border border-transparent bg-white/40 p-4 transition hover:border-indigo-200/80 hover:bg-white hover:shadow-md hover:shadow-indigo-900/[0.05] sm:p-5"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-50 text-indigo-600 ring-1 ring-slate-200/80 transition group-hover:from-indigo-50 group-hover:to-teal-50 group-hover:text-indigo-700">
                    <School className="size-6" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 truncate text-[15px] font-bold text-slate-900">
                      {r.courseName}
                      {pendingNew > 0 ? <NewsStatusBadge isRead={false} /> : null}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Markaz:</span> {r.tuman}
                    </p>
                    <p className="mt-1.5">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-800 ring-1 ring-indigo-200/80">
                        {virtualClassPrepGradeLabel(r.prepGradeLevel)}
                      </span>
                    </p>
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-slate-400">
                      <span>
                        Azolar:{" "}
                        <span className="font-semibold tabular-nums text-slate-600">{r._count.members}</span>
                      </span>
                      <span>
                        Testlar:{" "}
                        <span className="font-semibold tabular-nums text-slate-600">{r._count.assignedTests}</span>
                      </span>
                    </p>
                  </div>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                    <ArrowRight className="size-5 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
