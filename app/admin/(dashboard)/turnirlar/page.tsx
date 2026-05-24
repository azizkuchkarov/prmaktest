import Link from "next/link";
import { Plus, Pencil, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteTournament } from "./actions";
import {
  getTournamentPhase,
  tournamentPhaseLabelUz,
  formatTournamentWindowUz,
  tournamentCohortShortLabel,
} from "@/lib/tournament";
import { formatPriceSum } from "@/lib/format-uzs";

export default async function AdminTournamentsPage() {
  const items = await prisma.tournament.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      test: { select: { title: true, questionsCount: true, durationMinutes: true, priceSum: true } },
      _count: { select: { attempts: true } },
    },
  });
  const now = new Date();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-600" aria-hidden />
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Turnirlar
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Vaqt oralig‘i va sinf bloki (4-sinf / 6-sinf) bo‘yicha turnirlar. O‘quvchilar faqat
              belgilangan vaqtda qatnasha oladi; natijalar alohida reytingda.
            </p>
          </div>
          <Link
            href="/admin/turnirlar/yangi"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2563EB]/20 transition hover:brightness-105"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Yangi turnir
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Turnir</th>
              <th className="px-4 py-3">Blok</th>
              <th className="px-4 py-3">Vaqt</th>
              <th className="px-4 py-3">Narx</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Qatnashuvchilar</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Hozircha turnir yo&apos;q.
                </td>
              </tr>
            ) : (
              items.map((t) => {
                const phase = getTournamentPhase(t.startsAt, t.endsAt, now);
                return (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.test.questionsCount} savol · {t.test.durationMinutes} daq
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {tournamentCohortShortLabel(t.examTargetCohort)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatTournamentWindowUz(t.startsAt, t.endsAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.test.priceSum > 0 ? formatPriceSum(t.test.priceSum) : "Bepul"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={
                            phase === "live"
                              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                              : phase === "upcoming"
                                ? "rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800"
                                : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          }
                        >
                          {tournamentPhaseLabelUz(phase)}
                        </span>
                        <span
                          className={
                            t.isPublished
                              ? "rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800"
                              : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
                          }
                        >
                          {t.isPublished ? "Nashr" : "Qoralama"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t._count.attempts}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/turnirlar/${t.id}/reyting`}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                        >
                          Reyting
                        </Link>
                        <Link
                          href={`/admin/turnirlar/${t.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Tahrir
                        </Link>
                        <form action={deleteTournament.bind(null, t.id)}>
                          <button
                            type="submit"
                            className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            O&apos;chirish
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
