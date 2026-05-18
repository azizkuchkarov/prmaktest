export const MAX_QUESTIONS = 45;
export const DEFAULT_NEW_QUESTION_ROWS = 30;

export type QuestionDraft = {
  order: number;
  text: string;
  /** `/uploads/questions/...` yoki bo'sh */
  imageUrl: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionAImageUrl: string;
  optionBImageUrl: string;
  optionCImageUrl: string;
  optionDImageUrl: string;
  correctAnswer: "A" | "B" | "C" | "D";
  solution: string;
};

function optionFilled(text: string, imageUrl: string): boolean {
  return text.trim().length > 0 || imageUrl.trim().length > 0;
}

export function isQuestionComplete(q: QuestionDraft): boolean {
  const t = (s: string) => s.trim().length > 0;
  return (
    t(q.text) &&
    optionFilled(q.optionA, q.optionAImageUrl) &&
    optionFilled(q.optionB, q.optionBImageUrl) &&
    optionFilled(q.optionC, q.optionCImageUrl) &&
    optionFilled(q.optionD, q.optionDImageUrl) &&
    t(q.solution)
  );
}

export function validateTestQuestions(rows: QuestionDraft[]): string | null {
  const complete = rows.filter(isQuestionComplete);
  if (complete.length === 0) {
    return "Kamida bitta to'liq savol (savol matni, har bir variantda matn yoki rasm, to'g'ri javob, yechim) kiriting.";
  }
  if (rows.length > MAX_QUESTIONS) {
    return `Savollar soni ${MAX_QUESTIONS} tadan oshmasligi kerak.`;
  }
  return null;
}
