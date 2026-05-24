import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/student-auth";
import { getTournamentLeaderboard, getTournamentParticipantRank } from "@/lib/tournament-ranking";
import { TournamentLeaderboardTable } from "@/components/tournament/TournamentLeaderboardTable";
import {
  formatTournamentWindowUz,
  tournamentCohortShortLabel,
  getTournamentPhase,
  tournamentPhaseLabelUz,
} from "@/lib/tournament";
import { cohortLabelUz } from "@/lib/exam-program";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TournamentLeaderboardPage({ params }: Props) {
  const { id } = await params;
  const tournament = await prisma.tournament.findFirst({
    where: { id, isPublished: true },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      examTargetCohort: true,
      isPublished: true,
    },
  });

  if (!tournament) notFound();

  const student = await getCurrentStudent();
  const [rows, myRank] = await Promise.all([
    getTournamentLeaderboard(id, 50),
    student ? getTournamentParticipantRank(id, student.id) : null,
  ]);

  const phase = getTournamentPhase(tournament.startsAt, tournament.endsAt);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-amber-50/40 via-white to-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href={`/turnirlar/${id}`} className="text-sm font-semibold text-blue-600 hover:underline">
          ← Turnir
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Trophy className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Turnir reytingi</h1>
            <p className="mt-1 font-semibold text-slate-800">{tournament.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {tournamentCohortShortLabel(tournament.examTargetCohort)} ·{" "}
              {cohortLabelUz(tournament.examTargetCohort)} · {tournamentPhaseLabelUz(phase)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {formatTournamentWindowUz(tournament.startsAt, tournament.endsAt)}
            </p>
          </div>
        </div>

        {myRank ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-center text-sm">
            <span className="text-violet-900">
              Sizning o&apos;rningiz: <strong>#{myRank.rank}</strong> · {myRank.score}/{myRank.total} ·{" "}
              <strong>{myRank.points}</strong> ball
            </span>
          </div>
        ) : null}

        <TournamentLeaderboardTable
          rows={rows}
          currentUserId={student?.id}
          title="Turnir Leaderboard"
          subtitle="Faqat shu turnirda qatnashganlar. Umumiy kabinet reytingidan alohida."
        />
      </div>
    </div>
  );
}
