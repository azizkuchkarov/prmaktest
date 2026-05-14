/** O‘quvchi sinfi (asosiy maktab, 3–9) */
export const STUDENT_GRADE_MIN = 3;
export const STUDENT_GRADE_MAX = 9;

export const STUDENT_GRADES = Array.from(
  { length: STUDENT_GRADE_MAX - STUDENT_GRADE_MIN + 1 },
  (_, i) => i + STUDENT_GRADE_MIN,
);

export function isValidStudentGrade(n: number): boolean {
  return Number.isInteger(n) && n >= STUDENT_GRADE_MIN && n <= STUDENT_GRADE_MAX;
}

export function parseStudentGradeFromForm(raw: unknown): number | null {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return isValidStudentGrade(n) ? n : null;
}
