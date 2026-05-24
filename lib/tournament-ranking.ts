import { prisma } from "@/lib/prisma";

const SECONDS_PLACEHOLDER = 9_999_999;

export type TournamentLeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  viloyat: string;
  points: number;
  score: number;
  total: number;
};

function displayName(firstName: string, lastName: string): string {
  const s = `${firstName} ${lastName}`.trim();
  return s.length > 0 ? s : "O'quvchi";
}

export async function getTournamentLeaderboard(
  tournamentId: string,
  limit: number,
): Promise<TournamentLeaderboardRow[]> {
  const rows = await prisma.$queryRaw<
    {
      rank: bigint;
      userId: string;
      points: number;
      score: number;
      total: number;
      firstName: string;
      lastName: string;
      viloyat: string;
      tsec: bigint;
    }[]
  >`
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY ta."rankPoints" DESC,
          COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}) ASC,
          ta."userId" ASC
      ) AS rn,
      ta."userId",
      ta."rankPoints" AS points,
      ta."score",
      ta."total",
      u."firstName",
      u."lastName",
      u."viloyat"
    FROM "TournamentAttempt" ta
    INNER JOIN "User" u ON u."id" = ta."userId"
    WHERE ta."tournamentId" = ${tournamentId}
      AND ta."rankPoints" > 0
  )
  SELECT rn AS rank, "userId", points, score, total, "firstName", "lastName", "viloyat", 0::bigint AS tsec
  FROM ranked
  WHERE rn <= ${limit}
  ORDER BY rn ASC
  `;

  return rows.map((r) => ({
    rank: Number(r.rank),
    userId: r.userId,
    name: displayName(r.firstName, r.lastName),
    viloyat: r.viloyat,
    points: Number(r.points),
    score: Number(r.score),
    total: Number(r.total),
  }));
}

export async function getTournamentParticipantRank(
  tournamentId: string,
  userId: string,
): Promise<{ rank: number; points: number; score: number; total: number } | null> {
  const attempt = await prisma.tournamentAttempt.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
    select: { rankPoints: true, score: true, total: true, secondsUsed: true },
  });
  if (!attempt || attempt.rankPoints <= 0) return null;

  const myTsec = attempt.secondsUsed ?? SECONDS_PLACEHOLDER;
  const higher = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM "TournamentAttempt" ta
    WHERE ta."tournamentId" = ${tournamentId}
      AND ta."userId" != ${userId}
      AND ta."rankPoints" > 0
      AND (
        ta."rankPoints" > ${attempt.rankPoints}
        OR (
          ta."rankPoints" = ${attempt.rankPoints}
          AND COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}) < ${myTsec}
        )
        OR (
          ta."rankPoints" = ${attempt.rankPoints}
          AND COALESCE(ta."secondsUsed", ${SECONDS_PLACEHOLDER}) = ${myTsec}
          AND ta."userId" < ${userId}
        )
      )
  `;

  return {
    rank: (higher[0] != null ? Number(higher[0].c) : 0) + 1,
    points: attempt.rankPoints,
    score: attempt.score,
    total: attempt.total,
  };
}
