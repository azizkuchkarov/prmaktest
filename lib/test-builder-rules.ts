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
  correctAnswer: "A" | "B" | "C" | "D";
  solution: string;
};

export function isQuestionComplete(q: QuestionDraft): boolean {
  const t = (s: string) => s.trim().length > 0;
  return (
    t(q.text) &&
    t(q.optionA) &&
    t(q.optionB) &&
    t(q.optionC) &&
    t(q.optionD) &&
    t(q.solution)
  );
}

export function validateTestQuestions(rows: QuestionDraft[]): string | null {
  const complete = rows.filter(isQuestionComplete);
  if (complete.length === 0) {
    return "Kamida bitta to'liq savol (matn, A–D, to'g'ri javob, yechim) kiriting.";
  }
  if (rows.length > MAX_QUESTIONS) {
    return `Savollar soni ${MAX_QUESTIONS} tadan oshmasligi kerak.`;
  }
  return null;
}
