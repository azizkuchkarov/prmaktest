import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { computeVirtualClassesRanking } from "@/lib/virtual-class-leaderboard";
import { TeacherClassesRankingSection } from "@/components/teacher/TeacherClassesRankingSection";

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

const pane =
  "rounded-[1.5rem] border border-white/80 bg-white/80 p-6 shadow-xl shadow-indigo-950/[0.04] backdrop-blur-sm ring-1 ring-slate-200/55 sm:p-7";

export default async function TeacherClassesRankingPage() {
  const teacherId = await teacherIdStrict();

  const rows = await prisma.virtualClass.findMany({
    where: { teacherUserId: teacherId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      tuman: true,
      courseName: true,
      _count: { select: { assignedTests: true } },
    },
  });

  const rankingRows =
    rows.length === 0
      ? []
      : await computeVirtualClassesRanking(
          rows.map((r) => ({
            id: r.id,
            courseName: r.courseName,
            tuman: r.tuman,
            assignedTestCount: r._count.assignedTests,
          })),
        );

  return (
    <div className="space-y-8 sm:space-y-10">
      <nav aria-label="Navigatsiya zanjiri" className="flex flex-wrap items-center gap-1 text-[13px] font-medium">
        <Link
          href="/oqituvchi/sinfxonalar"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/70 px-3 py-1.5 text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-white hover:text-indigo-900"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Sinfxonalar
        </Link>
      </nav>

      <header className={pane}>
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-orange-500/35">
            <Trophy className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Sinflar reytingi</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Barcha virtual sinflaringizni bir xil qoida bilan solishtirish — o‘rtacha va jami rank ballar, diagrammalar
              va batafsil jadval. Har bir sinf uchun alohida boshqaruv sahifasiga jadvaldan o‘tishingiz mumkin.
            </p>
          </div>
        </div>
      </header>

      <TeacherClassesRankingSection rows={rankingRows} />
    </div>
  );
}
