import { prisma } from "@/lib/prisma";
import type { LeaderboardRow } from "@/lib/student-ranking";

export type VirtualClassLbRow = {
  userId: string;
  displayName: string;
  viloyat: string;
  totalRankPoints: number;
  secondsUsedSum: number;
};

/**
 * Leaderboard: faqat ACTIVE o‘quvchilar va shu sinfga biriktirilgan testlar bo‘yicha
 * `rankPoints` yig‘indisi (tenglar: kamroq jami vaqt yuqoriroq).
 */
export async function getVirtualClassLeaderboard(virtualClassId: string): Promise<VirtualClassLbRow[]> {
  const assignments = await prisma.virtualClassAssignedTest.findMany({
    where: { virtualClassId },
    select: { testId: true },
  });
  if (assignments.length === 0) return [];

  const testIds = assignments.map((a) => a.testId);

  const members = await prisma.virtualClassMember.findMany({
    where: { virtualClassId, status: "ACTIVE" },
    select: { studentUserId: true },
  });
  const userIds = members.map((m) => m.studentUserId);
  if (userIds.length === 0) return [];

  const attempts = await prisma.testAttempt.findMany({
    where: { userId: { in: userIds }, testId: { in: testIds } },
    select: { userId: true, rankPoints: true, secondsUsed: true },
  });

  const merge = new Map<string, { totalRankPoints: number; secondsUsedSum: number }>();
  for (const uid of userIds) {
    merge.set(uid, { totalRankPoints: 0, secondsUsedSum: 0 });
  }
  for (const a of attempts) {
    const cur = merge.get(a.userId);
    if (!cur) continue;
    cur.totalRankPoints += a.rankPoints;
    cur.secondsUsedSum += Math.max(0, a.secondsUsed ?? 0);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, phone: true, viloyat: true },
  });
  const nameByUser = new Map(users.map((u) => [u.id, u]));

  const rows: VirtualClassLbRow[] = [];
  for (const uid of userIds) {
    const agg = merge.get(uid)!;
    const u = nameByUser.get(uid);
    const fn = u?.firstName.trim() ?? "";
    const ln = u?.lastName.trim() ?? "";
    const fallback = u?.phone ? `O‘quvchi ${u.phone.slice(-4)}` : uid.slice(0, 8);
    const displayName = fn.length >= 2 && ln.length >= 2 ? `${fn} ${ln}`.trim() : fallback;

    rows.push({
      userId: uid,
      displayName,
      viloyat: u?.viloyat ?? "",
      totalRankPoints: agg.totalRankPoints,
      secondsUsedSum: agg.secondsUsedSum,
    });
  }

  rows.sort((a, b) => {
    if (b.totalRankPoints !== a.totalRankPoints) return b.totalRankPoints - a.totalRankPoints;
    if (a.secondsUsedSum !== b.secondsUsedSum) return a.secondsUsedSum - b.secondsUsedSum;
    return a.displayName.localeCompare(b.displayName);
  });

  return rows;
}

/** Kabinet `LeaderboardBoardTable` uchun (o‘qituvchi va o‘quvchi virtual sinf). */
export function virtualClassLbToLeaderboardRows(lb: VirtualClassLbRow[]): LeaderboardRow[] {
  return lb.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: r.displayName,
    viloyat: r.viloyat.trim() !== "" ? r.viloyat : "—",
    points: r.totalRankPoints,
  }));
}

/** O‘qituvchining barcha virtual sinflari uchun solishtirish (bir xil qoida: faol + biriktirilgan testlar). */
export type TeacherVirtualClassRankingRow = {
  rank: number;
  virtualClassId: string;
  courseName: string;
  tuman: string;
  activeStudentCount: number;
  assignedTestCount: number;
  sumRankPoints: number;
  /** Faol oʻquvchilar soniga nisbatan o‘rta */
  avgRankPoints: number;
  learnersWithAttempts: number;
  topStudentPoints: number;
  topStudentDisplayName: string | null;
};

/**
 * Kirish: Teacher virtualClass ro‘yxati (id + nomlar + `_count`).
 * chiqish: Reyting tartibi — avval `avgRankPoints`, keyin `sumRankPoints`.
 */
export async function computeVirtualClassesRanking(
  classes: readonly {
    id: string;
    courseName: string;
    tuman: string;
    assignedTestCount: number;
  }[],
): Promise<TeacherVirtualClassRankingRow[]> {
  const results = await Promise.all(
    classes.map(async (c) => {
      const lb = await getVirtualClassLeaderboard(c.id);
      const n = lb.length;
      const sumRankPoints = lb.reduce((s, r) => s + r.totalRankPoints, 0);
      const avgRankPoints = n > 0 ? sumRankPoints / n : 0;
      const learnersWithAttempts = lb.filter((r) => r.totalRankPoints > 0).length;
      const top = lb[0];

      const row: Omit<TeacherVirtualClassRankingRow, "rank"> = {
        virtualClassId: c.id,
        courseName: c.courseName,
        tuman: c.tuman,
        activeStudentCount: n,
        assignedTestCount: c.assignedTestCount,
        sumRankPoints,
        avgRankPoints,
        learnersWithAttempts,
        topStudentPoints: top?.totalRankPoints ?? 0,
        topStudentDisplayName: top && (top.totalRankPoints > 0 ? top.displayName : null),
      };
      return row;
    }),
  );

  results.sort((a, b) => {
    if (b.avgRankPoints !== a.avgRankPoints) return b.avgRankPoints - a.avgRankPoints;
    if (b.sumRankPoints !== a.sumRankPoints) return b.sumRankPoints - a.sumRankPoints;
    if (b.learnersWithAttempts !== a.learnersWithAttempts) return b.learnersWithAttempts - a.learnersWithAttempts;
    return a.courseName.localeCompare(b.courseName, "uz");
  });

  return results.map((r, i) => ({ ...r, rank: i + 1 }));
}
