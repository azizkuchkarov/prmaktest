import { prisma } from "@/lib/prisma";
import { isValidStudentGrade } from "@/lib/student-grade";

/** null yoki yo‘q bo‘lsa — tezlik taqqoslashda eng yomon deb hisoblanadi */
const SECONDS_PLACEHOLDER = 9_999_999;

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
    SELECT
      "userId",
      SUM("rankPoints")::int AS pts,
      SUM(COALESCE("secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
    FROM "TestAttempt"
    GROUP BY "userId"
    HAVING SUM("rankPoints") > 0
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY sub.pts DESC, sub.tsec ASC, sub."userId" ASC) AS rn,
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
    SELECT
      ta."userId",
      SUM(ta."rankPoints")::int AS pts,
      SUM(COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
    FROM "TestAttempt" ta
    INNER JOIN "User" u ON u."id" = ta."userId"
    WHERE u."viloyat" = ${viloyat}
    GROUP BY ta."userId"
    HAVING SUM(ta."rankPoints") > 0
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY sub.pts DESC, sub.tsec ASC, sub."userId" ASC) AS rn,
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

export async function getGradeRepublicLeaderboard(gradeLevel: number, limit: number): Promise<LeaderboardRow[]> {
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
    SELECT
      ta."userId",
      SUM(ta."rankPoints")::int AS pts,
      SUM(COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
    FROM "TestAttempt" ta
    INNER JOIN "User" u ON u."id" = ta."userId"
    WHERE u."gradeLevel" = ${gradeLevel}
    GROUP BY ta."userId"
    HAVING SUM(ta."rankPoints") > 0
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY sub.pts DESC, sub.tsec ASC, sub."userId" ASC) AS rn,
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

export async function getGradeViloyatLeaderboard(
  viloyat: string,
  gradeLevel: number,
  limit: number,
): Promise<LeaderboardRow[]> {
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
    SELECT
      ta."userId",
      SUM(ta."rankPoints")::int AS pts,
      SUM(COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
    FROM "TestAttempt" ta
    INNER JOIN "User" u ON u."id" = ta."userId"
    WHERE u."viloyat" = ${viloyat} AND u."gradeLevel" = ${gradeLevel}
    GROUP BY ta."userId"
    HAVING SUM(ta."rankPoints") > 0
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY sub.pts DESC, sub.tsec ASC, sub."userId" ASC) AS rn,
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
  gradeRepublicRank: number | null;
  gradeViloyatRank: number | null;
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

export async function getStudentRankSummary(
  userId: string,
  viloyat: string,
  gradeScope: number | null,
): Promise<StudentRankSummary> {
  const empty: StudentRankSummary = {
    totalPoints: 0,
    republicRank: null,
    viloyatRank: null,
    gradeRepublicRank: null,
    gradeViloyatRank: null,
  };

  const sumRows = await prisma.$queryRaw<[{ pts: bigint; tsec: bigint }]>`
    SELECT
      COALESCE(SUM("rankPoints"), 0)::bigint AS pts,
      COALESCE(SUM(COALESCE("secondsUsed", ${SECONDS_PLACEHOLDER})), 0)::bigint AS tsec
    FROM "TestAttempt"
    WHERE "userId" = ${userId}
  `;
  const totalPoints = sumRows[0] != null ? Number(sumRows[0].pts) : 0;
  const myTsec = sumRows[0] != null ? Number(sumRows[0].tsec) : 0;

  if (totalPoints <= 0) {
    return empty;
  }

  const higherRep = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM (
      SELECT
        "userId",
        SUM("rankPoints")::int AS pts,
        SUM(COALESCE("secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
      FROM "TestAttempt"
      GROUP BY "userId"
      HAVING SUM("rankPoints") > 0
    ) o
    WHERE o."userId" != ${userId}
      AND (
        o.pts > ${totalPoints}
        OR (o.pts = ${totalPoints} AND o.tsec < ${myTsec})
        OR (o.pts = ${totalPoints} AND o.tsec = ${myTsec} AND o."userId" < ${userId})
      )
  `;

  const higherVil = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM (
      SELECT
        ta."userId",
        SUM(ta."rankPoints")::int AS pts,
        SUM(COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
      FROM "TestAttempt" ta
      INNER JOIN "User" u ON u."id" = ta."userId"
      WHERE u."viloyat" = ${viloyat}
      GROUP BY ta."userId"
      HAVING SUM(ta."rankPoints") > 0
    ) o
    WHERE o."userId" != ${userId}
      AND (
        o.pts > ${totalPoints}
        OR (o.pts = ${totalPoints} AND o.tsec < ${myTsec})
        OR (o.pts = ${totalPoints} AND o.tsec = ${myTsec} AND o."userId" < ${userId})
      )
  `;

  const republicRank = (higherRep[0] != null ? Number(higherRep[0].c) : 0) + 1;
  const viloyatRank = (higherVil[0] != null ? Number(higherVil[0].c) : 0) + 1;

  if (gradeScope == null || !isValidStudentGrade(gradeScope)) {
    return {
      totalPoints,
      republicRank,
      viloyatRank,
      gradeRepublicRank: null,
      gradeViloyatRank: null,
    };
  }

  const gl = gradeScope;

  const higherGradeRep = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM (
      SELECT
        ta."userId",
        SUM(ta."rankPoints")::int AS pts,
        SUM(COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
      FROM "TestAttempt" ta
      INNER JOIN "User" u ON u."id" = ta."userId"
      WHERE u."gradeLevel" = ${gl}
      GROUP BY ta."userId"
      HAVING SUM(ta."rankPoints") > 0
    ) o
    WHERE o."userId" != ${userId}
      AND (
        o.pts > ${totalPoints}
        OR (o.pts = ${totalPoints} AND o.tsec < ${myTsec})
        OR (o.pts = ${totalPoints} AND o.tsec = ${myTsec} AND o."userId" < ${userId})
      )
  `;

  const higherGradeVil = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM (
      SELECT
        ta."userId",
        SUM(ta."rankPoints")::int AS pts,
        SUM(COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}))::bigint AS tsec
      FROM "TestAttempt" ta
      INNER JOIN "User" u ON u."id" = ta."userId"
      WHERE u."viloyat" = ${viloyat} AND u."gradeLevel" = ${gl}
      GROUP BY ta."userId"
      HAVING SUM(ta."rankPoints") > 0
    ) o
    WHERE o."userId" != ${userId}
      AND (
        o.pts > ${totalPoints}
        OR (o.pts = ${totalPoints} AND o.tsec < ${myTsec})
        OR (o.pts = ${totalPoints} AND o.tsec = ${myTsec} AND o."userId" < ${userId})
      )
  `;

  return {
    totalPoints,
    republicRank,
    viloyatRank,
    gradeRepublicRank: (higherGradeRep[0] != null ? Number(higherGradeRep[0].c) : 0) + 1,
    gradeViloyatRank: (higherGradeVil[0] != null ? Number(higherGradeVil[0].c) : 0) + 1,
  };
}
