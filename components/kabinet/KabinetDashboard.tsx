import dynamic from "next/dynamic";
import type { CurrentStudent } from "@/lib/student-auth";
import type {
  RadarSubjectPoint,
  ReadinessStats,
  WeekProgressPoint,
} from "@/lib/kabinet-analytics";
import type { LeaderboardRow, StudentRankSummary, ViloyatTotalRow } from "@/lib/student-ranking";
import type { KabinetBentoNews, KabinetBentoTest } from "@/components/kabinet/KabinetBentoContent";
import { KabinetPremiumShell } from "@/components/kabinet/KabinetPremiumShell";

const KabinetBentoContent = dynamic(
  () => import("@/components/kabinet/KabinetBentoContent").then((m) => m.KabinetBentoContent),
  {
    loading: () => (
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-4 px-[max(1rem,env(safe-area-inset-left))] py-7 pr-[max(1rem,env(safe-area-inset-right))] sm:px-6">
        <div className="h-36 rounded-3xl bg-slate-200/70 ring-1 ring-slate-200/60" />
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="h-48 rounded-3xl bg-slate-200/60 ring-1 ring-slate-200/50 lg:col-span-4" />
          <div className="h-48 rounded-3xl bg-slate-200/60 ring-1 ring-slate-200/50 lg:col-span-4" />
          <div className="h-48 rounded-3xl bg-slate-200/60 ring-1 ring-slate-200/50 lg:col-span-4" />
        </div>
        <div className="h-64 rounded-3xl bg-slate-200/50 ring-1 ring-slate-200/40 lg:col-span-12" />
      </div>
    ),
  },
);

export type KabinetNewsItem = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: Date;
};

export type KabinetTestItem = {
  id: string;
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  priceSum: number;
  questionsCount: number;
  stage: string;
  updatedAt: Date;
  completed: boolean;
};

type Props = {
  student: CurrentStudent;
  displayName: string;
  rank: StudentRankSummary;
  republicRows: LeaderboardRow[];
  viloyatRows: LeaderboardRow[];
  gradeRepublicRows: LeaderboardRow[];
  gradeViloyatRows: LeaderboardRow[];
  republicViloyatTotals: ViloyatTotalRow[];
  news: KabinetNewsItem[];
  tests: KabinetTestItem[];
  weekly: WeekProgressPoint[];
  radar: RadarSubjectPoint[];
  readiness: ReadinessStats;
};

export function KabinetDashboard({
  student,
  displayName,
  rank,
  republicRows,
  viloyatRows,
  gradeRepublicRows,
  gradeViloyatRows,
  republicViloyatTotals,
  news,
  tests,
  weekly,
  radar,
  readiness,
}: Props) {
  const firstPlayable =
    tests.find((t) => t.questionsCount > 0 && !t.completed) ?? tests.find((t) => t.questionsCount > 0);
  const ctaHref = firstPlayable ? `/testlar/${firstPlayable.id}/boshlash` : "/testlar";

  const bentoStudent = {
    id: student.id,
    phone: student.phone,
    viloyat: student.viloyat,
    firstName: student.firstName,
    lastName: student.lastName,
    parentPhone: student.parentPhone,
    balanceSum: student.balanceSum,
    gradeLevel: student.gradeLevel,
  };

  const newsSer: KabinetBentoNews[] = news.map((n) => ({
    ...n,
    updatedAt: n.updatedAt.toISOString(),
  }));
  const testsSer: KabinetBentoTest[] = tests.map((t) => ({
    ...t,
    updatedAt: t.updatedAt.toISOString(),
    completed: t.completed,
  }));

  return (
    <KabinetPremiumShell
      displayName={displayName}
      viloyat={student.viloyat}
      ctaHref={ctaHref}
      ctaLabel="Testni boshlash"
    >
      <KabinetBentoContent
        student={bentoStudent}
        displayName={displayName}
        rank={rank}
        republicRows={republicRows}
        viloyatRows={viloyatRows}
        gradeRepublicRows={gradeRepublicRows}
        gradeViloyatRows={gradeViloyatRows}
        republicViloyatTotals={republicViloyatTotals}
        news={newsSer}
        tests={testsSer}
        weekly={weekly}
        radar={radar}
        readiness={readiness}
      />
    </KabinetPremiumShell>
  );
}
