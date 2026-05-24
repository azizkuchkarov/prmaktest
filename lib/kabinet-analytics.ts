import { prisma } from "@/lib/prisma";
import { RADAR_AXIS_LABELS, TEST_CATALOG_ORDER, normalizeTestCatalogCategory } from "@/lib/test-catalog";

export type WeekProgressPoint = {
  label: string;
  value: number;
};

export type RadarSubjectPoint = {
  subject: string;
  fullMark: number;
};

export type ReadinessStats = {
  /** 0–100: tayyorgarlik foizi */
  pct: number;
  testsPublished: number;
  testsAttempted: number;
  avgScorePct: number;
};

function startOfWeekUtc(d: Date): Date {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - diff);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function weekKey(d: Date): string {
  return startOfWeekUtc(d).toISOString().slice(0, 10);
}

function formatWeekLabel(d: Date): string {
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${m}/${day}`;
}

/** So‘nggi 8 hafta: har hafta o‘rtacha foiz (score/total) */
export async function getStudentWeeklyProgress(userId: string): Promise<WeekProgressPoint[]> {
  const attempts = await prisma.testAttempt.findMany({
    where: { userId, total: { gt: 0 } },
    select: { createdAt: true, score: true, total: true },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const start = startOfWeekUtc(now);
  start.setUTCDate(start.getUTCDate() - 7 * 7);

  const buckets = new Map<string, { sum: number; n: number }>();
  for (let i = 0; i < 8; i++) {
    const w = new Date(start);
    w.setUTCDate(w.getUTCDate() + i * 7);
    buckets.set(weekKey(w), { sum: 0, n: 0 });
  }

  for (const a of attempts) {
    const k = weekKey(a.createdAt);
    if (!buckets.has(k)) continue;
    const b = buckets.get(k)!;
    b.sum += (a.score / a.total) * 100;
    b.n += 1;
  }

  const keys = [...buckets.keys()].sort();
  return keys.slice(-8).map((k) => {
    const b = buckets.get(k)!;
    const v = b.n === 0 ? 0 : Math.round(b.sum / b.n);
    const d = new Date(k + "T12:00:00.000Z");
    return { label: formatWeekLabel(d), value: v };
  });
}

/** Katalog bo‘limlari bo‘yicha o‘rtacha foiz — radar (har doim 4 o‘q: Mock, Matematika, Mantiqiy, Ingliz) */
export async function getStudentSubjectRadar(userId: string): Promise<RadarSubjectPoint[]> {
  const attempts = await prisma.testAttempt.findMany({
    where: { userId, total: { gt: 0 } },
    select: {
      score: true,
      total: true,
      test: { select: { catalogCategory: true } },
    },
  });

  const byCat = new Map<string, number[]>();
  for (const cat of TEST_CATALOG_ORDER) {
    byCat.set(cat, []);
  }

  for (const a of attempts) {
    const cat = normalizeTestCatalogCategory(String(a.test.catalogCategory));
    const pct = (a.score / a.total) * 100;
    const arr = byCat.get(cat)!;
    arr.push(pct);
  }

  return TEST_CATALOG_ORDER.map((cat) => {
    const arr = byCat.get(cat)!;
    const fullMark = arr.length === 0 ? 0 : Math.round(arr.reduce((s, x) => s + x, 0) / arr.length);
    return {
      subject: RADAR_AXIS_LABELS[cat],
      fullMark,
    };
  });
}

export async function getStudentReadiness(userId: string): Promise<ReadinessStats> {
  const [attempts, published] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId, total: { gt: 0 } },
      select: { testId: true, score: true, total: true },
    }),
    prisma.test.count({
      where: { isPublished: true, isTournamentOnly: false, questions: { some: {} } },
    }),
  ]);

  const testIds = new Set(attempts.map((a) => a.testId));
  const testsAttempted = testIds.size;

  let avgScorePct = 0;
  if (attempts.length > 0) {
    avgScorePct = attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length;
  }

  const completionPct = published === 0 ? 0 : Math.min(100, (testsAttempted / published) * 100);
  const pct = Math.round(Math.min(100, completionPct * 0.45 + avgScorePct * 0.55));

  return {
    pct: attempts.length === 0 && published === 0 ? 0 : pct,
    testsPublished: published,
    testsAttempted,
    avgScorePct: Math.round(avgScorePct),
  };
}
