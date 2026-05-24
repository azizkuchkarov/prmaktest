import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Trophy, Clock, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/student-auth";
import { isStudentProfileComplete, PROFILE_SETUP_PATH } from "@/lib/student-profile";
import {
  getTournamentPhase,
  tournamentPhaseLabelUz,
  tournamentVisibleForUserGrade,
  formatTournamentWindowUz,
  tournamentCohortShortLabel,
} from "@/lib/tournament";
import { cohortLabelUz } from "@/lib/exam-program";
import { formatPriceSum } from "@/lib/format-uzs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TournamentDetailPage({ params }: Props) {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (!isStudentProfileComplete(student)) redirect(PROFILE_SETUP_PATH);

  const { id } = await params;
  const tournament = await prisma.tournament.findFirst({
    where: { id, isPublished: true },
    include: {
      test: {
        select: {
          title: true,
          durationMinutes: true,
          questionsCount: true,
          subject: true,
          priceSum: true,
        },
      },
      _count: { select: { attempts: true } },
      attempts: {
        where: { userId: student.id },
        select: { score: true, total: true, rankPoints: true },
      },
    },
  });

  if (!tournament) notFound();

  if (!tournamentVisibleForUserGrade(tournament.examTargetCohort, student.gradeLevel)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-slate-700">Bu turnir sizning sinf blokingiz uchun emas.</p>
        <Link href="/turnirlar" className="mt-4 inline-block text-sm font-semibold text-blue-600">
          Turnirlar ro&apos;yxati
        </Link>
      </div>
    );
  }

  const now = new Date();
  const phase = getTournamentPhase(tournament.startsAt, tournament.endsAt, now);
  const done = tournament.attempts.length > 0;
  const attempt = tournament.attempts[0];
  const canJoin = phase === "live" && !done;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-amber-50/50 via-white to-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/turnirlar" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Turnirlar
        </Link>

        <div className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-lg shadow-amber-100/30">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <Trophy className="size-6" aria-hidden />
            </div>
            <div>
              <span
                className={
                  phase === "live"
                    ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800"
                    : phase === "upcoming"
                      ? "rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800"
                      : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600"
                }
              >
                {tournamentPhaseLabelUz(phase)}
              </span>
              <h1 className="mt-2 text-xl font-bold text-slate-900">{tournament.title}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {tournamentCohortShortLabel(tournament.examTargetCohort)} ·{" "}
                {cohortLabelUz(tournament.examTargetCohort)}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
              <div>
                <dt className="text-xs font-medium text-slate-500">Vaqt oralig&apos;i</dt>
                <dd className="font-medium text-slate-800">
                  {formatTournamentWindowUz(tournament.startsAt, tournament.endsAt)}
                </dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Users className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
              <div>
                <dt className="text-xs font-medium text-slate-500">Qatnashuvchilar</dt>
                <dd className="font-medium text-slate-800">{tournament._count.attempts} ta</dd>
              </div>
            </div>
          </dl>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{tournament.test.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {tournament.test.questionsCount} savol · {tournament.test.durationMinutes} daqiqa
              {tournament.test.subject ? ` · ${tournament.test.subject}` : ""}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              Narxi:{" "}
              {tournament.test.priceSum > 0
                ? formatPriceSum(tournament.test.priceSum)
                : "Bepul"}
            </p>
          </div>

          {done && attempt ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
              <p className="text-sm font-semibold text-emerald-900">Sizning natijangiz</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                {attempt.score}/{attempt.total}
              </p>
              <p className="text-sm text-emerald-700">+{attempt.rankPoints} turnir balli</p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-2">
            {canJoin ? (
              <>
                {tournament.test.priceSum > 0 ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-950">
                    Qatnashish boshlanganda balansingizdan{" "}
                    <strong>{formatPriceSum(tournament.test.priceSum)}</strong> yechiladi.
                  </p>
                ) : null}
                <Link
                  href={`/turnirlar/${id}/boshlash`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-md hover:brightness-105"
                >
                  Turnirda qatnashish
                </Link>
              </>
            ) : phase === "upcoming" ? (
              <p className="rounded-xl bg-sky-50 px-3 py-2 text-center text-sm text-sky-900">
                Turnir hali boshlanmagan. Belgilangan vaqtda qayting.
              </p>
            ) : phase === "ended" && !done ? (
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-center text-sm text-slate-700">
                Turnir vaqti tugagan. Siz qatnashmadingiz.
              </p>
            ) : null}

            <Link
              href={`/turnirlar/${id}/reyting`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-100"
            >
              Turnir reytingi (Leaderboard)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
