import { redirect } from "next/navigation";
import { KabinetDashboard } from "@/components/kabinet/KabinetDashboard";
import { getCurrentStudent } from "@/lib/student-auth";
import {
  getStudentRankSummary,
  getRepublicLeaderboard,
  getViloyatLeaderboard,
  getGradeRepublicLeaderboard,
  getGradeViloyatLeaderboard,
  getRepublicViloyatTotals,
} from "@/lib/student-ranking";
import {
  getStudentReadiness,
  getStudentSubjectRadar,
  getStudentWeeklyProgress,
} from "@/lib/kabinet-analytics";
import { isStudentProfileComplete, PROFILE_SETUP_PATH, studentDisplayName } from "@/lib/student-profile";
import { isValidStudentGrade } from "@/lib/student-grade";
import { prisma } from "@/lib/prisma";
import { getAdminSiteSettingsCached, isKabinetSupportReady } from "@/lib/admin-site-settings";
import { getNewsReadIdSet } from "@/lib/news-read";
import { getKabinetLiveStatsForDisplay } from "@/lib/kabinet-live-stats";

export const dynamic = "force-dynamic";

export default async function KabinetPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (!isStudentProfileComplete(student)) redirect(PROFILE_SETUP_PATH);

  const displayName = studentDisplayName(student);
  const gradeOk = isValidStudentGrade(student.gradeLevel);

  const [
    rank,
    republicRows,
    viloyatRows,
    gradeRepublicRows,
    gradeViloyatRows,
    republicViloyatTotals,
    completedAttempts,
    news,
    tests,
    weekly,
    radar,
    readiness,
    siteSettings,
    liveStats,
  ] = await Promise.all([
    getStudentRankSummary(student.id, student.viloyat, gradeOk ? student.gradeLevel : null),
    getRepublicLeaderboard(15),
    getViloyatLeaderboard(student.viloyat, 15),
    gradeOk ? getGradeRepublicLeaderboard(student.gradeLevel, 15) : Promise.resolve([]),
    gradeOk ? getGradeViloyatLeaderboard(student.viloyat, student.gradeLevel, 15) : Promise.resolve([]),
    getRepublicViloyatTotals(),
    prisma.testAttempt.findMany({
      where: { userId: student.id },
      select: { testId: true },
    }),
    prisma.news.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      take: 2,
      select: { id: true, title: true, excerpt: true, updatedAt: true },
    }),
    prisma.test.findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        subject: true,
        description: true,
        durationMinutes: true,
        priceSum: true,
        questionsCount: true,
        catalogCategory: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    getStudentWeeklyProgress(student.id),
    getStudentSubjectRadar(student.id),
    getStudentReadiness(student.id),
    getAdminSiteSettingsCached(),
    getKabinetLiveStatsForDisplay(),
  ]);

  const supportConfigured = isKabinetSupportReady(siteSettings.supportTelegramChatId);
  const completedTestIds = new Set(completedAttempts.map((a) => a.testId));
  const newsReadIds = await getNewsReadIdSet(
    student.id,
    news.map((n) => n.id),
  );
  const newsForDash = news.map((n) => ({ ...n, isRead: newsReadIds.has(n.id) }));

  return (
    <KabinetDashboard
      student={student}
      displayName={displayName}
      supportConfigured={supportConfigured}
      rank={rank}
      republicRows={republicRows}
      viloyatRows={viloyatRows}
      gradeRepublicRows={gradeRepublicRows}
      gradeViloyatRows={gradeViloyatRows}
      republicViloyatTotals={republicViloyatTotals}
      news={newsForDash}
      tests={tests.map((t) => ({ ...t, completed: completedTestIds.has(t.id) }))}
      weekly={weekly}
      radar={radar}
      readiness={readiness}
      liveStats={liveStats}
    />
  );
}
