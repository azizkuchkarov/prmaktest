import dynamic from "next/dynamic";
import type { CurrentStudent } from "@/lib/student-auth";
import type {
  RadarSubjectPoint,
  ReadinessStats,
  WeekProgressPoint,
} from "@/lib/kabinet-analytics";
import type { LeaderboardRow, StudentRankSummary, ViloyatTotalRow } from "@/lib/student-ranking";
import type { KabinetBentoNews, KabinetBentoTest } from "@/components/kabinet/KabinetBentoContent";
import type { KabinetLiveStatsPayload } from "@/lib/kabinet-live-stats.types";
import { KabinetStudyGuideProvider } from "@/components/kabinet/KabinetStudyGuide";
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
  isRead: boolean;
};

export type KabinetTestItem = {
  id: string;
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  priceSum: number;
  questionsCount: number;
  catalogCategory: string;
  stage: string;
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
};

type Props = {
  student: CurrentStudent;
  displayName: string;
  supportConfigured: boolean;
  rank: StudentRankSummary;
  viloyatRows: LeaderboardRow[];
  grade4RepublicRows: LeaderboardRow[];
  middleGradesRepublicRows: LeaderboardRow[];
  grade4ViloyatRows: LeaderboardRow[];
  middleGradesViloyatRows: LeaderboardRow[];
  republicViloyatTotals: ViloyatTotalRow[];
  news: KabinetNewsItem[];
  tests: KabinetTestItem[];
  weekly: WeekProgressPoint[];
  radar: RadarSubjectPoint[];
  readiness: ReadinessStats;
  liveStats: KabinetLiveStatsPayload;
};

export function KabinetDashboard({
  student,
  displayName,
  supportConfigured,
  rank,
  viloyatRows,
  grade4RepublicRows,
  middleGradesRepublicRows,
  grade4ViloyatRows,
  middleGradesViloyatRows,
  republicViloyatTotals,
  news,
  tests,
  weekly,
  radar,
  readiness,
  liveStats,
}: Props) {
  const bentoStudent = {
    id: student.id,
    phone: student.phone,
    viloyat: student.viloyat,
    firstName: student.firstName,
    lastName: student.lastName,
    parentPhone: student.parentPhone,
    balanceSum: student.balanceSum,
    gradeLevel: student.gradeLevel,
    telegramLinked: student.telegramId != null,
    telegramUsername: student.telegramUsername,
  };

  const newsSer: KabinetBentoNews[] = news.map((n) => ({
    ...n,
    updatedAt: n.updatedAt.toISOString(),
    isRead: n.isRead,
  }));
  const testsSer: KabinetBentoTest[] = tests.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    completed: t.completed,
  }));

  return (
    <KabinetStudyGuideProvider>
      <KabinetPremiumShell displayName={displayName} viloyat={student.viloyat} supportConfigured={supportConfigured}>
        <KabinetBentoContent
          student={bentoStudent}
          displayName={displayName}
          rank={rank}
          viloyatRows={viloyatRows}
          grade4RepublicRows={grade4RepublicRows}
          middleGradesRepublicRows={middleGradesRepublicRows}
          grade4ViloyatRows={grade4ViloyatRows}
          middleGradesViloyatRows={middleGradesViloyatRows}
          republicViloyatTotals={republicViloyatTotals}
          news={newsSer}
          tests={testsSer}
          weekly={weekly}
          radar={radar}
          readiness={readiness}
          liveStats={liveStats}
        />
      </KabinetPremiumShell>
    </KabinetStudyGuideProvider>
  );
}
