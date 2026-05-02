import { redirect } from "next/navigation";
import { KabinetDashboard } from "@/components/kabinet/KabinetDashboard";
import { getCurrentStudent } from "@/lib/student-auth";
import { getStudentRankSummary, getRepublicLeaderboard, getViloyatLeaderboard, getRepublicViloyatTotals } from "@/lib/student-ranking";
import {
  getStudentReadiness,
  getStudentSubjectRadar,
  getStudentWeeklyProgress,
} from "@/lib/kabinet-analytics";
import { isStudentProfileComplete, PROFILE_SETUP_PATH, studentDisplayName } from "@/lib/student-profile";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function KabinetPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (!isStudentProfileComplete(student)) redirect(PROFILE_SETUP_PATH);

  const displayName = studentDisplayName(student);

  const [rank, republicRows, viloyatRows, republicViloyatTotals, news, tests, weekly, radar, readiness] =
    await Promise.all([
      getStudentRankSummary(student.id, student.viloyat),
      getRepublicLeaderboard(15),
      getViloyatLeaderboard(student.viloyat, 15),
      getRepublicViloyatTotals(),
      prisma.news.findMany({
        where: { published: true },
        orderBy: { updatedAt: "desc" },
        take: 9,
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
          questionsCount: true,
          stage: true,
          updatedAt: true,
        },
      }),
      getStudentWeeklyProgress(student.id),
      getStudentSubjectRadar(student.id),
      getStudentReadiness(student.id),
    ]);

  return (
    <KabinetDashboard
      student={student}
      displayName={displayName}
      rank={rank}
      republicRows={republicRows}
      viloyatRows={viloyatRows}
      republicViloyatTotals={republicViloyatTotals}
      news={news}
      tests={tests}
      weekly={weekly}
      radar={radar}
      readiness={readiness}
    />
  );
}
