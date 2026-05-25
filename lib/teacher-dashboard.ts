import { prisma } from "@/lib/prisma";
import {
  computeVirtualClassesRanking,
  type TeacherVirtualClassRankingRow,
} from "@/lib/virtual-class-leaderboard";

export type TeacherDashboardKpis = {
  classesCount: number;
  activeStudents: number;
  pendingMemberships: number;
  assignedTestsTotal: number;
  totalRankPoints: number;
  learnersWithPoints: number;
  newActiveMembers30d: number;
  attemptsLast7d: number;
};

export type TeacherDashboardStatusSlice = {
  key: string;
  label: string;
  count: number;
  color: string;
};

export type TeacherDashboardClassBar = {
  virtualClassId: string;
  name: string;
  shortName: string;
  value: number;
};

export type TeacherDashboardGrowthRow = {
  virtualClassId: string;
  courseName: string;
  tuman: string;
  activeTotal: number;
  newActive30d: number;
  /** 0–100+, yangi a‘zolar / faollar */
  growthRate: number;
};

export type TeacherDashboardWeekPoint = {
  key: string;
  label: string;
  attempts: number;
  rankPoints: number;
};

export type TeacherDashboardActivity = {
  id: string;
  kind: "member" | "test" | "attempt";
  title: string;
  subtitle: string;
  atIso: string;
  href: string | null;
};

export type TeacherDashboardPayload = {
  kpis: TeacherDashboardKpis;
  membershipSlices: TeacherDashboardStatusSlice[];
  activeByClass: TeacherDashboardClassBar[];
  growthRanking: TeacherDashboardGrowthRow[];
  weeklyActivity: TeacherDashboardWeekPoint[];
  classRankingTop: TeacherVirtualClassRankingRow[];
  recentActivity: TeacherDashboardActivity[];
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Faol", color: "#10b981" },
  AWAITING_STUDENT: { label: "O‘quvchi tasdiqlashi", color: "#6366f1" },
  AWAITING_TEACHER: { label: "Siz tasdiqlaysiz", color: "#f59e0b" },
  TEACHER_INVITE_DRAFT: { label: "Tasdiq kutilyapti", color: "#94a3b8" },
  DECLINED: { label: "Rad etilgan", color: "#f87171" },
};

function shortName(name: string, max = 14): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function weekBuckets(): { key: string; label: string; start: Date; end: Date }[] {
  const out: { key: string; label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    const label = d.toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "short" });
    out.push({ key: d.toISOString().slice(0, 10), label, start: d, end });
  }
  return out;
}

export async function getTeacherDashboardPayload(teacherId: string): Promise<TeacherDashboardPayload> {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const classes = await prisma.virtualClass.findMany({
    where: { teacherUserId: teacherId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      courseName: true,
      tuman: true,
      _count: { select: { assignedTests: true } },
      members: {
        select: { status: true, updatedAt: true, createdAt: true },
      },
    },
  });

  const classIds = classes.map((c) => c.id);

  const statusCounts = new Map<string, number>();
  let activeStudents = 0;
  let pendingMemberships = 0;
  let newActiveMembers30d = 0;
  const activeByClass: TeacherDashboardClassBar[] = [];
  const growthRaw: Omit<TeacherDashboardGrowthRow, "growthRate">[] = [];

  for (const c of classes) {
    let activeInClass = 0;
    let newActiveInClass = 0;
    for (const m of c.members) {
      statusCounts.set(m.status, (statusCounts.get(m.status) ?? 0) + 1);
      if (m.status === "ACTIVE") {
        activeInClass++;
        activeStudents++;
        if (m.updatedAt >= since30) newActiveInClass++;
      }
      if (["AWAITING_STUDENT", "AWAITING_TEACHER", "TEACHER_INVITE_DRAFT"].includes(m.status)) {
        pendingMemberships++;
      }
    }
    newActiveMembers30d += newActiveInClass;
    activeByClass.push({
      virtualClassId: c.id,
      name: c.courseName,
      shortName: shortName(c.courseName),
      value: activeInClass,
    });
    growthRaw.push({
      virtualClassId: c.id,
      courseName: c.courseName,
      tuman: c.tuman,
      activeTotal: activeInClass,
      newActive30d: newActiveInClass,
    });
  }

  activeByClass.sort((a, b) => b.value - a.value);

  const growthRanking: TeacherDashboardGrowthRow[] = growthRaw
    .map((g) => ({
      ...g,
      growthRate:
        g.activeTotal > 0 ? Math.round((g.newActive30d / g.activeTotal) * 100) : g.newActive30d > 0 ? 100 : 0,
    }))
    .sort((a, b) => {
      if (b.newActive30d !== a.newActive30d) return b.newActive30d - a.newActive30d;
      return b.activeTotal - a.activeTotal;
    });

  const membershipSlices: TeacherDashboardStatusSlice[] = Object.entries(STATUS_META)
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      count: statusCounts.get(key) ?? 0,
      color: meta.color,
    }))
    .filter((s) => s.count > 0);

  const assignedTestsTotal = classes.reduce((s, c) => s + c._count.assignedTests, 0);

  const rankingInput = classes.map((c) => ({
    id: c.id,
    courseName: c.courseName,
    tuman: c.tuman,
    assignedTestCount: c._count.assignedTests,
  }));

  const classRankingTop =
    rankingInput.length === 0
      ? []
      : (await computeVirtualClassesRanking(rankingInput)).slice(0, 8);

  let totalRankPoints = 0;
  let learnersWithPoints = 0;
  let attemptsLast7d = 0;
  const weeklyActivity = weekBuckets().map((b) => ({
    key: b.key,
    label: b.label,
    attempts: 0,
    rankPoints: 0,
  }));

  const recentActivity: TeacherDashboardActivity[] = [];

  if (classIds.length > 0) {
    const [activeMembers, assignments, recentMembers, recentAssigns] = await Promise.all([
      prisma.virtualClassMember.findMany({
        where: { virtualClassId: { in: classIds }, status: "ACTIVE" },
        select: { studentUserId: true, virtualClassId: true, updatedAt: true },
      }),
      prisma.virtualClassAssignedTest.findMany({
        where: { virtualClassId: { in: classIds } },
        select: { testId: true, virtualClassId: true, createdAt: true, test: { select: { title: true } } },
      }),
      prisma.virtualClassMember.findMany({
        where: { virtualClassId: { in: classIds } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          virtualClass: { select: { id: true, courseName: true } },
          student: { select: { firstName: true, lastName: true, phone: true } },
        },
      }),
      prisma.virtualClassAssignedTest.findMany({
        where: { virtualClassId: { in: classIds } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          createdAt: true,
          virtualClass: { select: { id: true, courseName: true } },
          test: { select: { title: true } },
        },
      }),
    ]);

    const userIds = [...new Set(activeMembers.map((m) => m.studentUserId))];
    const testIds = [...new Set(assignments.map((a) => a.testId))];

    if (userIds.length > 0 && testIds.length > 0) {
      const attempts = await prisma.testAttempt.findMany({
        where: {
          userId: { in: userIds },
          testId: { in: testIds },
          createdAt: { gte: since7 },
        },
        select: {
          id: true,
          rankPoints: true,
          createdAt: true,
          userId: true,
          test: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      attemptsLast7d = attempts.length;
      const buckets = weekBuckets();
      const userPoints = new Map<string, number>();
      for (const a of attempts) {
        totalRankPoints += a.rankPoints;
        const b = buckets.find((w) => a.createdAt >= w.start && a.createdAt < w.end);
        if (b) {
          const row = weeklyActivity.find((w) => w.key === b.key);
          if (row) {
            row.attempts += 1;
            row.rankPoints += a.rankPoints;
          }
        }
        userPoints.set(a.userId, (userPoints.get(a.userId) ?? 0) + a.rankPoints);
      }
      learnersWithPoints = [...userPoints.values()].filter((p) => p > 0).length;

      for (const a of attempts.slice(0, 5)) {
        recentActivity.push({
          id: `att-${a.id}`,
          kind: "attempt",
          title: a.test.title,
          subtitle: `+${a.rankPoints} rank ball`,
          atIso: a.createdAt.toISOString(),
          href: null,
        });
      }
    }

    for (const m of recentMembers.slice(0, 5)) {
      const fn = m.student.firstName?.trim() ?? "";
      const ln = m.student.lastName?.trim() ?? "";
      const name =
        fn.length >= 2 && ln.length >= 2 ? `${fn} ${ln}` : m.student.phone?.slice(-4) ?? "O‘quvchi";
      recentActivity.push({
        id: `mem-${m.id}`,
        kind: "member",
        title: name,
        subtitle: `${STATUS_META[m.status]?.label ?? m.status} · ${m.virtualClass.courseName}`,
        atIso: m.updatedAt.toISOString(),
        href: `/oqituvchi/sinflar/${m.virtualClass.id}`,
      });
    }

    for (const a of recentAssigns) {
      recentActivity.push({
        id: `asg-${a.id}`,
        kind: "test",
        title: a.test.title,
        subtitle: `Biriktirildi · ${a.virtualClass.courseName}`,
        atIso: a.createdAt.toISOString(),
        href: `/oqituvchi/sinflar/${a.virtualClass.id}`,
      });
    }

    recentActivity.sort((a, b) => new Date(b.atIso).getTime() - new Date(a.atIso).getTime());
  }

  const kpisTotalRank =
    totalRankPoints > 0
      ? totalRankPoints
      : classRankingTop.reduce((s, r) => s + r.sumRankPoints, 0);
  const kpisLearners =
    learnersWithPoints > 0
      ? learnersWithPoints
      : classRankingTop.reduce((s, r) => s + r.learnersWithAttempts, 0);

  return {
    kpis: {
      classesCount: classes.length,
      activeStudents,
      pendingMemberships,
      assignedTestsTotal,
      totalRankPoints: kpisTotalRank,
      learnersWithPoints: kpisLearners,
      newActiveMembers30d,
      attemptsLast7d,
    },
    membershipSlices,
    activeByClass,
    growthRanking,
    weeklyActivity,
    classRankingTop,
    recentActivity: recentActivity.slice(0, 10),
  };
}
