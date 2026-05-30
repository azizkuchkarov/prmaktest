import { redirect } from "next/navigation";
import { KabinetDashboard } from "@/components/kabinet/KabinetDashboard";
import { getCurrentStudent } from "@/lib/student-auth";
import {
  getStudentRankSummary,
  getViloyatLeaderboard,
  LEADERBOARD_PRIMARY_REPUBLIC_GRADE,
  getGradeRepublicLeaderboard,
  getGradeViloyatLeaderboard,
  getMiddleGradesRepublicLeaderboard,
  getMiddleGradesViloyatLeaderboard,
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
import { examTestVisibleForUserGrade } from "@/lib/exam-program";
import {
  getTournamentPhase,
  tournamentVisibleForUserGrade,
} from "@/lib/tournament";
import { getStudentVirtualSinflarNewCount } from "@/lib/virtual-class-new";
import {
  TEACHER_LOGIN_HOME,
  isStudentRole,
  isTeacherRole,
} from "@/lib/user-app-role";

export const dynamic = "force-dynamic";

export default async function KabinetPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (!isStudentRole(student.appUserRole)) {
    if (isTeacherRole(student.appUserRole)) redirect(TEACHER_LOGIN_HOME);
    redirect("/auth/kirish");
  }
  if (!isStudentProfileComplete(student)) redirect(PROFILE_SETUP_PATH);

  const displayName = studentDisplayName(student);
  const gradeOk = isValidStudentGrade(student.gradeLevel);

  const [
    rank,
    viloyatRows,
    grade4RepublicRows,
    middleGradesRepublicRows,
    grade4ViloyatRows,
    middleGradesViloyatRows,
    republicViloyatTotals,
    completedAttempts,
    news,
    tests,
    weekly,
    radar,
    readiness,
    siteSettings,
    liveStats,
    tournamentsRaw,
  ] = await Promise.all([
    getStudentRankSummary(student.id, student.viloyat, gradeOk ? student.gradeLevel : null),
    getViloyatLeaderboard(student.viloyat, 15),
    getGradeRepublicLeaderboard(LEADERBOARD_PRIMARY_REPUBLIC_GRADE, 15),
    getMiddleGradesRepublicLeaderboard(15),
    getGradeViloyatLeaderboard(student.viloyat, LEADERBOARD_PRIMARY_REPUBLIC_GRADE, 15),
    getMiddleGradesViloyatLeaderboard(student.viloyat, 15),
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
      where: { isPublished: true, isTournamentOnly: false },
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
        examSchoolProgram: true,
        examTargetCohort: true,
        specializedSixTrack: true,
      },
    }),
    getStudentWeeklyProgress(student.id),
    getStudentSubjectRadar(student.id),
    getStudentReadiness(student.id),
    getAdminSiteSettingsCached(),
    getKabinetLiveStatsForDisplay(),
    prisma.tournament.findMany({
      where: { isPublished: true },
      orderBy: { startsAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        examTargetCohort: true,
        test: { select: { priceSum: true } },
        attempts: {
          where: { userId: student.id },
          select: { id: true },
        },
      },
    }),
  ]);

  const supportConfigured = isKabinetSupportReady(siteSettings.supportTelegramChatId);
  const virtualSinflarNewCount = await getStudentVirtualSinflarNewCount(student.id);
  const completedTestIds = new Set(completedAttempts.map((a) => a.testId));
  const newsReadIds = await getNewsReadIdSet(
    student.id,
    news.map((n) => n.id),
  );
  const newsForDash = news.map((n) => ({ ...n, isRead: newsReadIds.has(n.id) }));
  const testsVisible = tests.filter((t) => examTestVisibleForUserGrade(t, student.gradeLevel));
  const now = new Date();
  const tournaments = tournamentsRaw
    .filter((t) => tournamentVisibleForUserGrade(t.examTargetCohort, student.gradeLevel))
    .map((t) => ({
      id: t.id,
      title: t.title,
      startsAt: t.startsAt.toISOString(),
      endsAt: t.endsAt.toISOString(),
      examTargetCohort: t.examTargetCohort,
      priceSum: t.test.priceSum,
      participated: t.attempts.length > 0,
      phase: getTournamentPhase(t.startsAt, t.endsAt, now),
    }));

  return (
    <KabinetDashboard
      student={student}
      displayName={displayName}
      supportConfigured={supportConfigured}
      rank={rank}
      viloyatRows={viloyatRows}
      grade4RepublicRows={grade4RepublicRows}
      middleGradesRepublicRows={middleGradesRepublicRows}
      grade4ViloyatRows={grade4ViloyatRows}
      middleGradesViloyatRows={middleGradesViloyatRows}
      republicViloyatTotals={republicViloyatTotals}
      news={newsForDash}
      tests={testsVisible.map((t) => ({ ...t, completed: completedTestIds.has(t.id) }))}
      weekly={weekly}
      radar={radar}
      readiness={readiness}
      liveStats={liveStats}
      tournaments={tournaments}
      virtualSinflarNewCount={virtualSinflarNewCount}
    />
  );
}
