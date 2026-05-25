import { examTestVisibleForUserGrade, type ExamAwareTestPick } from "@/lib/exam-program";

/** Virtual sinf yaratishda tanlanadigan tayyorlov bloklari */
export const VIRTUAL_CLASS_PREP_BLOCKS = [
  {
    value: "elementary",
    prepGradeLevel: 4,
    label: "4-sinf bloki",
    hint: "Faqat 4-sinf (va 3–4) tayyorlov testlari — Prezident, Ixtisos 4-blok, Al-Xorazmiy.",
  },
  {
    value: "middle",
    prepGradeLevel: 6,
    label: "5–9-sinf bloki",
    hint: "6-sinf sikli testlari — Ixtisos maktabda Aniq / Tabiiy fanlar boʻlinishi bilan.",
  },
] as const;

export type VirtualClassPrepBlockValue = (typeof VIRTUAL_CLASS_PREP_BLOCKS)[number]["value"];

export function parseVirtualClassPrepBlock(raw: unknown): VirtualClassPrepBlockValue | null {
  const v = String(raw ?? "").trim();
  if (v === "elementary" || v === "middle") return v;
  return null;
}

export function prepGradeLevelFromBlock(block: VirtualClassPrepBlockValue): number {
  const row = VIRTUAL_CLASS_PREP_BLOCKS.find((b) => b.value === block);
  return row?.prepGradeLevel ?? 4;
}

export function virtualClassPrepGradeLabel(prepGradeLevel: number): string {
  if (prepGradeLevel <= 4) return "4-sinf bloki";
  return "5–9-sinf · 6-sinf testlari";
}

export function virtualClassTestVisibleForPrepGrade(
  test: ExamAwareTestPick,
  prepGradeLevel: number,
): boolean {
  return examTestVisibleForUserGrade(test, prepGradeLevel);
}
