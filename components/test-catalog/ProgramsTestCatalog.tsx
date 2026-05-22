"use client";

import Link from "next/link";
import { Check, ChevronDown, Clock, Banknote } from "lucide-react";
import type {
  ExamSchoolProgram,
  ExamTargetCohort,
  SpecializedSixTrack,
  TestCatalogCategory,
} from "@prisma/client";
import { formatPriceSum } from "@/lib/format-uzs";
import { cn } from "@/lib/utils";
import { RenderFractionText } from "@/components/math/RenderFractionText";
import {
  EXAM_PROGRAM_LABELS,
  cohortLabelUz,
  trackLabelUz,
  examSchoolProgramLabelShort,
} from "@/lib/exam-program";
import {
  CATALOG_PANEL_PREMIUM,
  CATALOG_SECTION_META,
  PROGRAM_FLAT_LIST_CARD_ACCENT,
  normalizeTestCatalogCategory,
} from "@/lib/test-catalog";
import { AccordionDetails } from "@/components/test-catalog/AccordionDetails";
import type { ProgramCatalogBlock, ProgramCatalogGroup } from "@/lib/build-exam-catalog-sections";

/** Client serializatsiya (Date ISO) */
export type CatalogTestFlat = {
  id: string;
  title: string;
  catalogCategory: TestCatalogCategory | null;
  subject: string | null;
  description: string | null;
  durationMinutes: number;
  priceSum: number;
  _count: { questions: number };
  examSchoolProgram: ExamSchoolProgram;
  examTargetCohort: ExamTargetCohort;
  specializedSixTrack: SpecializedSixTrack;
};

export function ProgramsTestCatalog({
  groups,
  completedIds,
  defaultOpenProgram,
}: {
  groups: ProgramCatalogGroup[];
  completedIds: string[];
  defaultOpenProgram: ExamSchoolProgram;
}) {
  const doneSet = new Set(completedIds);

  function renderTestCard(t: CatalogTestFlat, keyPrefix: string) {
    const usePresidentCategoryBlocks = t.examSchoolProgram === "PRESIDENT_SCHOOL";
    const tCat = normalizeTestCatalogCategory(t.catalogCategory ?? "MATHEMATICS");
    const tAccent = usePresidentCategoryBlocks
      ? CATALOG_PANEL_PREMIUM[tCat]
      : PROGRAM_FLAT_LIST_CARD_ACCENT;
    const done = doneSet.has(t.id);
    const cohortChip =
      t.examTargetCohort === "COHORT_4_PREP"
        ? "4-sinf bloki"
        : t.examSchoolProgram === "SPECIALIZED_SCHOOL" && t.examTargetCohort === "COHORT_6_CYCLE"
          ? cohortLabelUz(t.examTargetCohort) + " · " + trackLabelUz(t.specializedSixTrack)
          : "6-sinf bloki · 5–9";
    return (
      <li key={`${keyPrefix}-${t.id}`}>
        <Link
          href={`/testlar/${t.id}`}
          className={cn(
            "group relative block h-full overflow-hidden rounded-2xl border p-5 shadow-md transition duration-300",
            tAccent.cardBar,
            done
              ? "border-emerald-200/85 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/25 shadow-[0_22px_48px_-28px_rgba(16,185,129,0.35)] ring-1 ring-emerald-200/50"
              : "border-slate-200/80 bg-white/95 shadow-slate-200/45 backdrop-blur-sm hover:border-blue-200/90 hover:shadow-[0_24px_50px_-28px_rgba(37,99,235,0.2)]",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl transition-opacity group-hover:opacity-90",
              done ? "bg-emerald-400/20 opacity-100" : cn("opacity-70", tAccent.orb),
            )}
            aria-hidden
          />
          {done ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent"
              aria-hidden
            />
          ) : null}
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={cn(
                    "break-words text-lg font-semibold leading-snug",
                    done ? "text-emerald-950" : "text-slate-900",
                  )}
                >
                  {t.title}
                </h3>
                {done ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-300/80 bg-emerald-100/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 shadow-sm">
                    Yechilgan
                  </span>
                ) : null}
                <span className="rounded-full border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {cohortChip}
                </span>
              </div>
              {t.subject ? <p className="mt-1 text-sm font-medium text-teal-700">{t.subject}</p> : null}
            </div>
            {done ? (
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/35 ring-2 ring-white/90"
                title="Rasmiy topshiruv qilingan"
              >
                <Check className="h-5 w-5" aria-hidden strokeWidth={2.75} />
                <span className="sr-only">Tugallangan</span>
              </span>
            ) : null}
          </div>
          {t.description ? (
            <div className="relative mt-3 line-clamp-3 text-[0.9375rem] leading-[1.65] text-slate-600">
              <RenderFractionText text={t.description} />
            </div>
          ) : null}
          <div className="relative mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium",
                done
                  ? "bg-white/80 text-emerald-900 ring-1 ring-emerald-200/60"
                  : "bg-slate-50 text-slate-700",
              )}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {t.durationMinutes} daqiqa
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-1 font-medium",
                done ? "bg-white/80 text-blue-900 ring-1 ring-blue-100" : "bg-blue-50 text-blue-800",
              )}
            >
              {t._count.questions} savol
            </span>
            {t.priceSum > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-900 ring-1 ring-emerald-100/80">
                <Banknote className="h-3.5 w-3.5" aria-hidden />
                {formatPriceSum(t.priceSum)}
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "relative mt-4 text-xs font-semibold transition group-hover:underline",
              done ? "text-emerald-800" : "text-blue-600",
            )}
          >
            Batafsil →
          </p>
        </Link>
      </li>
    );
  }

  function renderFlatList(list: CatalogTestFlat[], keyPrefix: string) {
    if (list.length === 0) {
      return <p className="text-sm text-slate-500">Hozircha bu yerda test yoʻq.</p>;
    }
    return (
      <ul className="grid gap-5 sm:grid-cols-2">
        {list.map((t) => renderTestCard(t, `${keyPrefix}-row`))}
      </ul>
    );
  }

  function renderCategorySections(
    sections: { cat: TestCatalogCategory; items: CatalogTestFlat[] }[],
    keyPrefix: string,
  ) {
    const withTests = sections.filter((s) => s.items.length > 0);

    if (withTests.length === 0) {
      return (
        <p className="text-sm text-slate-500">
          Hozircha test yoʻq — Prezident maktabi testlari Mock, Matematika, Tanqidiy-mantiqiy va Ingliz tili
          boʻlimlarida chiqadi.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {withTests.map(({ cat, items: list }) => {
          const meta = CATALOG_SECTION_META[cat];
          const total = list.length;
          const accent = CATALOG_PANEL_PREMIUM[cat];
          return (
            <AccordionDetails
              key={`${keyPrefix}-${cat}`}
              defaultOpen
              className={cn(
                "group overflow-hidden rounded-2xl border bg-white/85 shadow-md shadow-slate-200/30 ring-1 ring-slate-200/40 transition open:shadow-lg open:ring-slate-300/50",
                accent.cardBar,
              )}
              summary={(open) => (
                <summary
                  className={cn(
                    "relative flex min-h-[3.25rem] cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 outline-none transition [touch-action:manipulation] hover:brightness-[1.01] focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:min-h-0 sm:px-5 sm:py-4",
                    "[&::-webkit-details-marker]:hidden",
                    accent.header,
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute -right-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full blur-2xl",
                      accent.orb,
                    )}
                  />
                  <div className="relative min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{meta.heading}</h3>
                      <span className="rounded-full border border-white/70 bg-white/80 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-800 shadow-sm backdrop-blur-sm sm:text-xs">
                        {total} ta test
                      </span>
                    </div>
                    <p className="relative mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {meta.subtitle}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "relative mt-1 h-5 w-5 shrink-0 text-slate-600 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                    aria-hidden
                  />
                </summary>
              )}
            >
              <div className="border-t border-slate-200/70 bg-gradient-to-b from-white/90 to-slate-50/40 px-4 py-4 sm:px-5 sm:py-5">
                <ul className="grid gap-5 sm:grid-cols-2">
                  {list.map((t) => renderTestCard(t, `${keyPrefix}-${cat}`))}
                </ul>
              </div>
            </AccordionDetails>
          );
        })}
      </div>
    );
  }

  function countInBlock(block: ProgramCatalogBlock): number {
    if (block.kind === "categories") {
      return block.sections.reduce((a, s) => a + s.items.length, 0);
    }
    if (block.kind === "flat") {
      return block.items.length;
    }
    return block.exactItems.length + block.naturalItems.length;
  }

  return (
    <div className="mt-10 flex flex-col gap-5 sm:gap-6">
      {groups.map(({ program, block }) => {
        const meta = EXAM_PROGRAM_LABELS[program];
        const total = countInBlock(block);
        return (
          <AccordionDetails
            key={program}
            defaultOpen={program === defaultOpenProgram && total > 0}
            className={cn(
              "overflow-hidden rounded-2xl border-2 border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 shadow-lg shadow-slate-200/40 ring-1 ring-slate-200/50",
              total === 0 ? "opacity-80" : "",
            )}
            summary={(open) => (
              <summary
                className={cn(
                  "relative flex min-h-[3.5rem] cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 outline-none transition [touch-action:manipulation] hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:px-6 sm:py-5",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{meta.title}</h2>
                    <span className="rounded-full bg-gradient-to-r from-blue-600/10 to-violet-600/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-900 ring-1 ring-blue-200/60">
                      {examSchoolProgramLabelShort(program)}
                    </span>
                    <span className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-800">
                      jami {total} test
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{meta.subtitle}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "mt-1 h-5 w-5 shrink-0 text-slate-600 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </summary>
            )}
          >
            <div className="border-t border-slate-200/70 px-4 py-5 sm:px-6">
              {total === 0 ? (
                <p className="text-sm text-slate-500">
                  Sizning sinf uchun bu dasturda hozircha testlar qoʻshilmagan.
                </p>
              ) : block.kind === "categories" ? (
                renderCategorySections(block.sections as { cat: TestCatalogCategory; items: CatalogTestFlat[] }[], program)
              ) : block.kind === "flat" ? (
                renderFlatList(block.items as CatalogTestFlat[], `${program}-flat`)
              ) : (
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Aniq fanlar</h4>
                    <p className="mt-1 text-xs text-slate-600">Ixtisoslashtirilgan maktab — 6-sinf bloki.</p>
                    <div className="mt-3">
                      {renderFlatList(block.exactItems as CatalogTestFlat[], `${program}-exact`)}
                    </div>
                  </div>
                  <div className="border-t border-slate-200/60 pt-6">
                    <h4 className="text-sm font-bold text-slate-900">Tabiiy fanlar</h4>
                    <p className="mt-1 text-xs text-slate-600">Ixtisoslashtirilgan maktab — 6-sinf bloki.</p>
                    <div className="mt-3">
                      {renderFlatList(block.naturalItems as CatalogTestFlat[], `${program}-natural`)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionDetails>
        );
      })}
    </div>
  );
}
