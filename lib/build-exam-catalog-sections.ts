import type { ExamSchoolProgram, ExamTargetCohort, SpecializedSixTrack, TestCatalogCategory } from "@prisma/client";
import { EXAM_PROGRAM_ORDER } from "@/lib/exam-program";
import { TEST_CATALOG_ORDER, normalizeTestCatalogCategory } from "@/lib/test-catalog";

export type CatalogTestRowModel = {
  id: string;
  title: string;
  catalogCategory: TestCatalogCategory | null;
  subject: string | null;
  description: string | null;
  durationMinutes: number;
  priceSum: number;
  /** Server: Date; client: ISO string */
  createdAt: Date | string;
  _count: { questions: number };
  examSchoolProgram: ExamSchoolProgram;
  examTargetCohort: ExamTargetCohort;
  specializedSixTrack: SpecializedSixTrack;
  /** Kabinet: yechilganligi */
  completed?: boolean;
};

export type CategorySection = { cat: TestCatalogCategory; items: CatalogTestRowModel[] };

/** Prezident maktabi: Mock, Matematika, … Boshqa dasturlar: fan bloklari yoʻq, tekis roʻyxat */
export type ProgramCatalogBlock =
  | { kind: "categories"; sections: CategorySection[] }
  | { kind: "flat"; items: CatalogTestRowModel[] }
  | {
      kind: "specialized_upper";
      exactItems: CatalogTestRowModel[];
      naturalItems: CatalogTestRowModel[];
    };

export type ProgramCatalogGroup = {
  program: ExamSchoolProgram;
  block: ProgramCatalogBlock;
};

function sortItemsNewestFirst(items: CatalogTestRowModel[]): CatalogTestRowModel[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function countProgramBlock(block: ProgramCatalogBlock): number {
  if (block.kind === "categories") {
    return block.sections.reduce((acc, s) => acc + s.items.length, 0);
  }
  if (block.kind === "flat") {
    return block.items.length;
  }
  return block.exactItems.length + block.naturalItems.length;
}

export function pickDefaultOpenProgram(groups: ProgramCatalogGroup[]): ExamSchoolProgram {
  for (const g of groups) {
    if (countProgramBlock(g.block) > 0) return g.program;
  }
  return EXAM_PROGRAM_ORDER[0];
}

function bucketByCategory(items: CatalogTestRowModel[]): Record<TestCatalogCategory, CatalogTestRowModel[]> {
  const buckets: Record<TestCatalogCategory, CatalogTestRowModel[]> = {
    MOCK: [],
    MATHEMATICS: [],
    CRITICAL_LOGIC: [],
    ENGLISH: [],
  };
  for (const t of items) {
    const c = normalizeTestCatalogCategory(String(t.catalogCategory ?? "MATHEMATICS"));
    buckets[c].push(t);
  }
  for (const c of TEST_CATALOG_ORDER) {
    (buckets[c] ?? []).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }
  return buckets;
}

function toCategorySections(buckets: Record<TestCatalogCategory, CatalogTestRowModel[]>): CategorySection[] {
  return TEST_CATALOG_ORDER.map((cat) => ({ cat, items: buckets[cat] ?? [] }));
}

export function buildProgramCatalogGroups(
  items: CatalogTestRowModel[],
  gradeLevel: number | null,
): ProgramCatalogGroup[] {
  const useGuest = gradeLevel == null;
  const upper = !useGuest && gradeLevel >= 5 && gradeLevel <= 9;

  return EXAM_PROGRAM_ORDER.map((program) => {
    const programItems = items.filter((t) => t.examSchoolProgram === program);

    /** Ixtisos: 7–9 — faqat «Aniq / Tabiiy» boʻlinishi (ichida fan bloklari yoʻq). */
    if (program === "SPECIALIZED_SCHOOL" && upper) {
      const gradeSixUnifiedFlat =
        gradeLevel !== null && gradeLevel === 6;
      if (gradeSixUnifiedFlat) {
        const flatSix = programItems.filter((t) => t.examTargetCohort === "COHORT_6_CYCLE");
        return {
          program,
          block: { kind: "flat", items: sortItemsNewestFirst(flatSix) },
        };
      }

      const exactItems = programItems.filter(
        (t) =>
          t.examTargetCohort === "COHORT_6_CYCLE" &&
          t.specializedSixTrack === "EXACT_SCIENCES",
      );
      const naturalItems = programItems.filter(
        (t) =>
          t.examTargetCohort === "COHORT_6_CYCLE" &&
          t.specializedSixTrack === "NATURAL_SCIENCES",
      );
      return {
        program,
        block: {
          kind: "specialized_upper",
          exactItems: sortItemsNewestFirst(exactItems),
          naturalItems: sortItemsNewestFirst(naturalItems),
        },
      };
    }

    const filteredItems = programItems.filter((t) => {
      if (useGuest) return true;
      if (upper) {
        return t.examTargetCohort === "COHORT_6_CYCLE";
      }
      return t.examTargetCohort === "COHORT_4_PREP";
    });

    /** Faqat Prezident: Mock, Matematika, Mantiqiy, Ingliz tili bloklari */
    if (program === "PRESIDENT_SCHOOL") {
      return {
        program,
        block: {
          kind: "categories",
          sections: toCategorySections(bucketByCategory(filteredItems)),
        },
      };
    }

    /** Ixtisos (4-blok va mehmon) hamda Al-Xorazmiy: ichki bloklarsiz roʻyxat */
    return {
      program,
      block: { kind: "flat", items: sortItemsNewestFirst(filteredItems) },
    };
  });
}
