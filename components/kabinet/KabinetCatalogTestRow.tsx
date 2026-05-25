"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, Check, Clock } from "lucide-react";
import type { TestCatalogCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatPriceSum } from "@/lib/format-uzs";
import { cohortLabelUz, trackLabelUz } from "@/lib/exam-program";
import { CATALOG_LABEL_ADMIN, CATALOG_PANEL_PREMIUM, PROGRAM_FLAT_LIST_CARD_ACCENT } from "@/lib/test-catalog";
import type { KabinetBentoTest } from "@/components/kabinet/kabinet-bento-types";

export function KabinetCatalogTestRow({
  test: t,
  category,
  useFlatAccent = false,
  secondaryAction,
}: {
  test: KabinetBentoTest;
  category: TestCatalogCategory;
  useFlatAccent?: boolean;
  secondaryAction?: ReactNode;
}) {
  const accent = useFlatAccent
    ? PROGRAM_FLAT_LIST_CARD_ACCENT
    : CATALOG_PANEL_PREMIUM[category];
  const done = t.completed;
  const cohortChip =
    t.examTargetCohort === "COHORT_4_PREP"
      ? "4-sinf bloki"
      : t.examSchoolProgram === "SPECIALIZED_SCHOOL"
        ? `${cohortLabelUz(t.examTargetCohort)} · ${trackLabelUz(t.specializedSixTrack)}`
        : "6-sinf · 5–9";
  return (
    <li
      className={cn(
        "group/card relative box-border w-full min-w-0 max-w-full overflow-hidden rounded-2xl py-3.5 pl-3 pr-3 transition duration-300 sm:pl-4 sm:pr-4",
        accent.cardBar,
        done
          ? "border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/45 to-teal-50/30 shadow-[0_22px_48px_-26px_rgba(16,185,129,0.45)] ring-1 ring-emerald-300/35"
          : cn(
              "border border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-sm",
              "hover:border-slate-300/90 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.18)]",
            ),
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover/card:opacity-[0.14]",
          done ? "bg-emerald-400/25 opacity-[0.12]" : cn("opacity-[0.07]", accent.orb),
        )}
      />
      {done ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1] flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "break-words text-[13px] font-semibold leading-snug tracking-tight sm:text-sm",
                done ? "text-emerald-950" : "text-slate-900",
              )}
            >
              {t.title}
            </h3>
            <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {cohortChip}
            </span>
            {done ? (
              <Badge
                variant="outline"
                className="h-5 shrink-0 rounded-full border-emerald-300/80 bg-emerald-100/80 px-2 py-0 text-[10px] font-bold uppercase tracking-wide text-emerald-900 shadow-sm"
              >
                Yechilgan
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700/90">
            {CATALOG_LABEL_ADMIN[category]}
          </p>
          {t.subject ? (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{t.subject}</p>
          ) : null}
        </div>
        {done ? (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-white/90"
            title="Rasmiy topshiruv qilingan"
          >
            <Check className="h-5 w-5" aria-hidden strokeWidth={2.75} />
            <span className="sr-only">Tugallangan</span>
          </span>
        ) : null}
      </div>
      <div className={cn("relative z-[1] mt-3 flex flex-wrap gap-2", done && "opacity-90")}>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium",
            done
              ? "border-emerald-200/60 bg-white/70 text-emerald-900"
              : "border-slate-200/80 bg-slate-50 text-slate-600",
          )}
        >
          <Clock className={cn("h-3.5 w-3.5", done ? "text-emerald-600" : "text-slate-400")} />
          {t.durationMinutes} daq
        </span>
        <span className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-semibold", accent.chipBorder)}>
          {t.questionsCount} savol
        </span>
        {t.priceSum > 0 ? (
          <span className="inline-flex items-center gap-0.5 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
            <Banknote className="h-3.5 w-3.5" aria-hidden />
            {formatPriceSum(t.priceSum)}
          </span>
        ) : null}
      </div>
      <div className="relative z-[1] mt-4 flex flex-col gap-2 border-t border-slate-100/90 pt-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:justify-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:justify-end">
          {t.questionsCount > 0 ? (
            <Link
              href={`/testlar/${t.id}`}
              className={cn(
                "inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold shadow-sm transition min-[400px]:w-auto",
                done
                  ? "border border-emerald-200/90 bg-white/90 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/80"
                  : "border border-slate-200/90 bg-white text-slate-800 hover:border-blue-200 hover:bg-slate-50 hover:text-blue-800",
              )}
            >
              Test haqida
              <ArrowRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </Link>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">{"Savollar yo'q"}</span>
          )}
          {secondaryAction ? (
            <div className="flex w-full min-w-0 justify-stretch min-[400px]:w-auto min-[400px]:justify-end">
              {secondaryAction}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
