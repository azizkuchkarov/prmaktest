import { prisma } from "@/lib/prisma";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  viloyat: string;
  points: number;
};

function displayName(firstName: string, lastName: string): string {
  const s = `${firstName} ${lastName}`.trim();
  return s.length > 0 ? s : "O'quvchi";
}

export async function getRepublicLeaderboard(limit: number): Promise<LeaderboardRow[]> {
  const rows = await prisma.$queryRaw<
    {
      rank: bigint;
      userId: string;
      points: number;
      firstName: string;
      lastName: string;
      viloyat: string;
    }[]
  >`
  WITH sub AS (
    SELECT "userId", SUM("rankPoints")::int AS pts
    FROM "TestAttempt"
    GROUP BY "userId"
    HAVING SUM("rankPoints") > 0
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY sub.pts DESC) AS rn,
      sub."userId",
      sub.pts AS points,
      u."firstName",
      u."lastName",
      u."viloyat"
    FROM sub
    JOIN "User" u ON u."id" = sub."userId"
  )
  SELECT rn AS rank, "userId", points, "firstName", "lastName", "viloyat" FROM ranked
  WHERE rn <= ${limit}
  ORDER BY rn ASC
  `;
  return rows.map((r) => ({
    rank: Number(r.rank),
    userId: r.userId,
    name: displayName(r.firstName, r.lastName),
    viloyat: r.viloyat,
    points: Number(r.points),
  }));
}

export async function getViloyatLeaderboard(viloyat: string, limit: number): Promise<LeaderboardRow[]> {
  const rows = await prisma.$queryRaw<
    {
      rank: bigint;
      userId: string;
      points: number;
      firstName: string;
      lastName: string;
      viloyat: string;
    }[]
  >`
  WITH sub AS (
    SELECT ta."userId", SUM(ta."rankPoints")::int AS pts
    FROM "TestAttempt" ta
    INNER JOIN "User" u ON u."id" = ta."userId"
    WHERE u."viloyat" = ${viloyat}
    GROUP BY ta."userId"
    HAVING SUM(ta."rankPoints") > 0
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY sub.pts DESC) AS rn,
      sub."userId",
      sub.pts AS points,
      u."firstName",
      u."lastName",
      u."viloyat"
    FROM sub
    JOIN "User" u ON u."id" = sub."userId"
  )
  SELECT rn AS rank, "userId", points, "firstName", "lastName", "viloyat" FROM ranked
  WHERE rn <= ${limit}
  ORDER BY rn ASC
  `;
  return rows.map((r) => ({
    rank: Number(r.rank),
    userId: r.userId,
    name: displayName(r.firstName, r.lastName),
    viloyat: r.viloyat,
    points: Number(r.points),
  }));
}

export type StudentRankSummary = {
  totalPoints: number;
  republicRank: number | null;
  viloyatRank: number | null;
};

export type ViloyatTotalRow = {
  viloyat: string;
  totalPoints: number;
};

/** Respublika: har bir viloyatdagi barcha o‘quvchilarning yig‘ma rank balli (diagramma uchun) */
export async function getRepublicViloyatTotals(): Promise<ViloyatTotalRow[]> {
  const rows = await prisma.$queryRaw<{ viloyat: string; totalPoints: bigint }[]>`
    SELECT u."viloyat", COALESCE(SUM(ta."rankPoints"), 0)::bigint AS "totalPoints"
    FROM "User" u
    LEFT JOIN "TestAttempt" ta ON ta."userId" = u."id"
    GROUP BY u."viloyat"
    HAVING COALESCE(SUM(ta."rankPoints"), 0) > 0
    ORDER BY "totalPoints" DESC
  `;
  return rows.map((r) => ({
    viloyat: r.viloyat,
    totalPoints: Number(r.totalPoints),
  }));
}

export async function getStudentRankSummary(userId: string, viloyat: string): Promise<StudentRankSummary> {
  // $queryRaw: `prisma generate` eskirgan bo‘lsa ham client `aggregate` `rankPoints` ni rad qilmasin.
  const sumRows = await prisma.$queryRaw<[{ s: bigint }]>`
    SELECT COALESCE(SUM("rankPoints"), 0)::bigint AS s
    FROM "TestAttempt"
    WHERE "userId" = ${userId}
  `;
  const totalPoints = sumRows[0] != null ? Number(sumRows[0].s) : 0;

  if (totalPoints <= 0) {
    return { totalPoints: 0, republicRank: null, viloyatRank: null };
  }

  const higherRep = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c FROM (
      SELECT "userId", SUM("rankPoints") AS pts
      FROM "TestAttempt"
      GROUP BY "userId"
      HAVING SUM("rankPoints") > ${totalPoints}
    ) t
  `;

  const higherVil = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c FROM (
      SELECT ta."userId", SUM(ta."rankPoints") AS pts
      FROM "TestAttempt" ta
      INNER JOIN "User" u ON u."id" = ta."userId"
      WHERE u."viloyat" = ${viloyat}
      GROUP BY ta."userId"
      HAVING SUM(ta."rankPoints") > ${totalPoints}
    ) t
  `;

  return {
    totalPoints,
    republicRank: (higherRep[0] != null ? Number(higherRep[0].c) : 0) + 1,
    viloyatRank: (higherVil[0] != null ? Number(higherVil[0].c) : 0) + 1,
  };
}
