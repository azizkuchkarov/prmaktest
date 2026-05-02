import type { CurrentStudent } from "@/lib/student-auth";
import type {
  RadarSubjectPoint,
  ReadinessStats,
  WeekProgressPoint,
} from "@/lib/kabinet-analytics";
import type { LeaderboardRow, StudentRankSummary, ViloyatTotalRow } from "@/lib/student-ranking";
import { KabinetBentoContent, type KabinetBentoNews, type KabinetBentoTest } from "@/components/kabinet/KabinetBentoContent";
import { KabinetPremiumShell } from "@/components/kabinet/KabinetPremiumShell";

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
  questionsCount: number;
  stage: string;
  updatedAt: Date;
};

type Props = {
  student: CurrentStudent;
  displayName: string;
  rank: StudentRankSummary;
  republicRows: LeaderboardRow[];
  viloyatRows: LeaderboardRow[];
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
  republicViloyatTotals,
  news,
  tests,
  weekly,
  radar,
  readiness,
}: Props) {
  const firstPlayable = tests.find((t) => t.questionsCount > 0);
  const ctaHref = firstPlayable ? `/testlar/${firstPlayable.id}/boshlash` : "/testlar";

  const bentoStudent = {
    id: student.id,
    phone: student.phone,
    viloyat: student.viloyat,
    firstName: student.firstName,
    lastName: student.lastName,
    parentPhone: student.parentPhone,
  };

  const newsSer: KabinetBentoNews[] = news.map((n) => ({
    ...n,
    updatedAt: n.updatedAt.toISOString(),
  }));
  const testsSer: KabinetBentoTest[] = tests.map((t) => ({
    ...t,
    updatedAt: t.updatedAt.toISOString(),
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
