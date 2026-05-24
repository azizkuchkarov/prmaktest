import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, ChevronRight } from "lucide-react";
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

export const metadata = { title: "Turnirlar" };

export default async function TurnirlarPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (!isStudentProfileComplete(student)) redirect(PROFILE_SETUP_PATH);

  const tournaments = await prisma.tournament.findMany({
    where: { isPublished: true },
    orderBy: { startsAt: "desc" },
    include: {
      test: {
        select: { title: true, durationMinutes: true, questionsCount: true, priceSum: true },
      },
      attempts: {
        where: { userId: student.id },
        select: { id: true, score: true, total: true, rankPoints: true },
      },
    },
  });

  const now = new Date();
  const visible = tournaments.filter((t) =>
    tournamentVisibleForUserGrade(t.examTargetCohort, student.gradeLevel),
  );

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-amber-50/40 via-white to-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/kabinet" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Kabinet
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-amber-600" aria-hidden />
            <h1 className="text-2xl font-bold text-slate-900">Turnirlar</h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Admin belgilagan vaqtda qatnashing. Natijalar alohida turnir reytingida e&apos;lon
            qilinadi.
          </p>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            Sizning sinf blokingiz uchun hozircha turnir yo&apos;q.
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((t) => {
              const phase = getTournamentPhase(t.startsAt, t.endsAt, now);
              const done = t.attempts.length > 0;
              const attempt = t.attempts[0];

              return (
                <li key={t.id}>
                  <Link
                    href={`/turnirlar/${t.id}`}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-amber-200 hover:shadow-md"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                      <Trophy className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-900">{t.title}</h2>
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
                        {done ? (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                            Qatnashdingiz
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {tournamentCohortShortLabel(t.examTargetCohort)} · {cohortLabelUz(t.examTargetCohort)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatTournamentWindowUz(t.startsAt, t.endsAt)}
                        {t.test.priceSum > 0 ? (
                          <> · {formatPriceSum(t.test.priceSum)}</>
                        ) : (
                          <> · Bepul</>
                        )}
                      </p>
                      {done && attempt ? (
                        <p className="mt-2 text-sm font-semibold text-emerald-700">
                          Natija: {attempt.score}/{attempt.total} · +{attempt.rankPoints} ball
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="mt-2 size-5 shrink-0 text-slate-400" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
