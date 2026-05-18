"use client";

import Link from "next/link";
import { Check, ChevronDown, Clock, Banknote } from "lucide-react";
import type { TestCatalogCategory } from "@prisma/client";
import { formatPriceSum } from "@/lib/format-uzs";
import { cn } from "@/lib/utils";
import {
  CATALOG_PANEL_PREMIUM,
  CATALOG_SECTION_META,
  normalizeTestCatalogCategory,
} from "@/lib/test-catalog";
import { AccordionDetails } from "./AccordionDetails";

export type PublicCatalogTestRow = {
  id: string;
  title: string;
  catalogCategory: TestCatalogCategory | null;
  subject: string | null;
  description: string | null;
  durationMinutes: number;
  priceSum: number;
  _count: { questions: number };
};

type Section = { cat: TestCatalogCategory; items: PublicCatalogTestRow[] };

type Props = {
  sections: Section[];
  defaultOpenCategory: TestCatalogCategory;
  completedIds: string[];
};

export function PublicTestCatalogList({ sections, defaultOpenCategory, completedIds }: Props) {
  const doneSet = new Set(completedIds);
  return (
    <div className="mt-10 flex flex-col gap-4 sm:gap-5">
      {sections.map(({ cat, items: list }) => {
        const meta = CATALOG_SECTION_META[cat];
        const total = list.length;
        const accent = CATALOG_PANEL_PREMIUM[cat];
        return (
          <AccordionDetails
            key={cat}
            defaultOpen={cat === defaultOpenCategory}
            className={cn(
              "group overflow-hidden rounded-2xl border bg-white/85 shadow-md shadow-slate-200/30 ring-1 ring-slate-200/40 transition open:shadow-lg open:ring-slate-300/50",
              accent.cardBar,
              total === 0 ? "opacity-90" : "",
            )}
            summary={(open) => (
              <summary
                className={cn(
                  "relative flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 outline-none transition hover:brightness-[1.01] focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:px-5 sm:py-4",
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
                    <h2
                      id={`cat-${cat}`}
                      className="text-base font-bold tracking-tight text-slate-900 sm:text-lg"
                    >
                      {meta.heading}
                    </h2>
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
              {total === 0 ? (
                <p className="text-sm text-slate-500">Bu bo&apos;limda hozircha test yo&apos;q.</p>
              ) : (
                <ul className="grid gap-5 sm:grid-cols-2">
                  {list.map((t) => {
                    const tCat = normalizeTestCatalogCategory(t.catalogCategory ?? "MATHEMATICS");
                    const tAccent = CATALOG_PANEL_PREMIUM[tCat];
                    const done = doneSet.has(t.id);
                    return (
                      <li key={t.id}>
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
                              </div>
                              {t.subject ? (
                                <p className="mt-1 text-sm font-medium text-teal-700">{t.subject}</p>
                              ) : null}
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
                            <p className="relative mt-3 line-clamp-3 text-sm text-slate-600">{t.description}</p>
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
                  })}
                </ul>
              )}
            </div>
          </AccordionDetails>
        );
      })}
    </div>
  );
}
