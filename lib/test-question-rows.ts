import type { TestChoice } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { isQuestionComplete, type QuestionDraft } from "@/lib/test-builder-rules";

function toChoice(v: string): TestChoice | null {
  if (v === "A" || v === "B" || v === "C" || v === "D") return v as TestChoice;
  return null;
}

export type QuestionRowInsert = Omit<Prisma.QuestionCreateManyInput, "testId">;

export function buildQuestionRows(payload: QuestionDraft[]): QuestionRowInsert[] {
  const complete = payload.filter(isQuestionComplete);
  return complete.map((q, idx) => {
    const c = toChoice(q.correctAnswer);
    if (!c) throw new Error("invalid_choice");
    return {
      order: idx + 1,
      text: q.text.trim(),
      imageUrl: q.imageUrl?.trim() ? q.imageUrl.trim() : null,
      optionA: q.optionA.trim(),
      optionB: q.optionB.trim(),
      optionC: q.optionC.trim(),
      optionD: q.optionD.trim(),
      optionAImageUrl: q.optionAImageUrl?.trim() ? q.optionAImageUrl.trim() : null,
      optionBImageUrl: q.optionBImageUrl?.trim() ? q.optionBImageUrl.trim() : null,
      optionCImageUrl: q.optionCImageUrl?.trim() ? q.optionCImageUrl.trim() : null,
      optionDImageUrl: q.optionDImageUrl?.trim() ? q.optionDImageUrl.trim() : null,
      correctAnswer: c,
      solution: q.solution.trim(),
    };
  });
}
