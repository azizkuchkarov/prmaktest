"use client";

import { ChevronDown } from "lucide-react";
import type { ExamSchoolProgram, TestCatalogCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  EXAM_PROGRAM_LABELS,
  examSchoolProgramLabelShort,
} from "@/lib/exam-program";
import {
  CATALOG_PANEL_PREMIUM,
  CATALOG_SECTION_META,
  normalizeTestCatalogCategory,
} from "@/lib/test-catalog";
import { KabinetCatalogTestRow } from "@/components/kabinet/KabinetCatalogTestRow";
import type { KabinetBentoTest } from "@/components/kabinet/kabinet-bento-types";
import type {
  CatalogTestRowModel,
  ProgramCatalogBlock,
  ProgramCatalogGroup,
} from "@/lib/build-exam-catalog-sections";
import { AccordionDetails } from "@/components/test-catalog/AccordionDetails";

function catalogModelToKabinetRow(t: CatalogTestRowModel): KabinetBentoTest {
  const createdIso = typeof t.createdAt === "string" ? t.createdAt : t.createdAt.toISOString();
  return {
    id: t.id,
    title: t.title,
    subject: t.subject ?? "",
    description: t.description ?? "",
    durationMinutes: t.durationMinutes,
    priceSum: t.priceSum,
    questionsCount: t._count.questions,
    stage: "saralash",
    updatedAt: createdIso,
    createdAt: createdIso,
    completed: !!t.completed,
    catalogCategory: String(t.catalogCategory ?? "MATHEMATICS"),
    examSchoolProgram: t.examSchoolProgram,
    examTargetCohort: t.examTargetCohort,
    specializedSixTrack: t.specializedSixTrack,
  };
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

export function KabinetProgramsCatalog({
  groups,
  defaultOpenProgram,
}: {
  groups: ProgramCatalogGroup[];
  defaultOpenProgram: ExamSchoolProgram;
}) {
  function flatInner(rows: CatalogTestRowModel[]) {
    if (rows.length === 0) {
      return <p className="py-6 text-center text-sm text-slate-500">Hozircha test yoʻq.</p>;
    }
    return (
      <ul className="min-w-0 space-y-3">
        {rows.map((row) => (
          <KabinetCatalogTestRow
            key={row.id}
            test={catalogModelToKabinetRow(row)}
            category={normalizeTestCatalogCategory(String(row.catalogCategory))}
            useFlatAccent
          />
        ))}
      </ul>
    );
  }

  function categoryInner(
    sections: { cat: TestCatalogCategory; items: CatalogTestRowModel[] }[],
    outerKey: string,
  ) {
    const withTests = sections.filter((s) => s.items.length > 0);

    if (withTests.length === 0) {
      return (
        <p className="text-sm text-slate-500">
          Hozircha Prezident maktabi uchun test yoʻq — ular Mock, Matematika, Tanqidiy-mantiqiy va Ingliz tili
          boʻlimlarida chiqadi.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {withTests.map(({ cat, items: list }) => {
          const meta = CATALOG_SECTION_META[cat];
          const accent = CATALOG_PANEL_PREMIUM[cat];
          const total = list.length;
          return (
            <AccordionDetails
              key={`${outerKey}-${cat}`}
              defaultOpen
              className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-sm ring-1 ring-slate-100 transition duration-200 open:shadow-md open:ring-slate-200/80"
              summary={(open) => (
                <summary
                  className={cn(
                    "relative flex cursor-pointer list-none items-start justify-between gap-3 overflow-x-clip border-b border-white/50 px-3 py-4 outline-none transition hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:px-5",
                    "[&::-webkit-details-marker]:hidden",
                    accent.header,
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute -right-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full blur-2xl",
                      accent.orb,
                    )}
                  />
                  <div className="relative min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-bold tracking-tight text-slate-900 sm:text-base">
                        {meta.heading}
                      </h3>
                      <span className="rounded-full border border-white/60 bg-white/75 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-800 shadow-sm backdrop-blur-sm sm:text-xs">
                        {total} ta test
                      </span>
                    </div>
                    <p className="relative mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-slate-600 sm:text-[13px]">
                      {meta.subtitle}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "relative mt-0.5 h-5 w-5 shrink-0 text-slate-600 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                    aria-hidden
                  />
                </summary>
              )}
            >
              <div className="relative flex min-w-0 flex-1 flex-col bg-white/60 p-3 sm:p-5">
                <ul className="min-w-0 space-y-3">
                  {list.map((row) => {
                    const kt = catalogModelToKabinetRow(row);
                    const nc = normalizeTestCatalogCategory(String(row.catalogCategory));
                    return (
                      <KabinetCatalogTestRow key={row.id} test={kt} category={nc} />
                    );
                  })}
                </ul>
              </div>
            </AccordionDetails>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative mt-8 flex flex-col gap-5 lg:gap-6">
      {groups.map(({ program, block }) => {
        const meta = EXAM_PROGRAM_LABELS[program];
        const total = countInBlock(block);
        return (
          <AccordionDetails
            key={program}
            defaultOpen={program === defaultOpenProgram && total > 0}
            className={cn(
              "group relative flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border-2 border-slate-200/70 bg-white/85 shadow-md ring-1 ring-slate-200/35",
              total === 0 ? "opacity-75" : "",
            )}
            summary={(open) => (
              <summary
                className={cn(
                  "relative flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 outline-none transition hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:px-6 sm:py-5",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <div className="relative min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{meta.title}</h3>
                    <span className="rounded-full bg-gradient-to-r from-blue-600/12 to-violet-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-900 ring-1 ring-blue-200/50">
                      {examSchoolProgramLabelShort(program)}
                    </span>
                    <span className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-800">
                      jami {total}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{meta.subtitle}</p>
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
            <div className="relative border-t border-slate-100/90 bg-white/55 px-3 py-4 sm:px-6 sm:py-6">
              {total === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Sizning sinf uchun bu maktab ostida testlar hozircha qoʻshilmagan.
                </p>
              ) : block.kind === "categories" ? (
                categoryInner(block.sections as { cat: TestCatalogCategory; items: CatalogTestRowModel[] }[], program)
              ) : block.kind === "flat" ? (
                flatInner(block.items)
              ) : (
                <div className="flex flex-col gap-8">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Aniq fanlar · 6-sinf bloki</p>
                    <div className="mt-4">{flatInner(block.exactItems)}</div>
                  </div>
                  <div className="border-t border-dashed border-slate-200/90 pt-8">
                    <p className="text-sm font-bold text-slate-900">Tabiiy fanlar · 6-sinf bloki</p>
                    <div className="mt-4">{flatInner(block.naturalItems)}</div>
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
