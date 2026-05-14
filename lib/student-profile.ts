/** Reytingda ism-familiya, sinf, ota-ona raqami to‘liq bo‘lsa — keyingi sahifalarga yo‘l ochiladi. */
export type StudentProfileFields = {
  firstName: string;
  lastName: string;
  parentPhone: string;
  gradeLevel: number;
};

export function isStudentProfileComplete(p: StudentProfileFields): boolean {
  const fn = p.firstName.trim();
  const ln = p.lastName.trim();
  const pp = p.parentPhone.trim();
  const g = p.gradeLevel;
  return (
    fn.length >= 2 &&
    ln.length >= 2 &&
    pp.length === 12 &&
    pp.startsWith("998") &&
    Number.isInteger(g) &&
    g >= 3 &&
    g <= 9
  );
}

export function studentDisplayName(p: StudentProfileFields): string {
  return `${p.firstName.trim()} ${p.lastName.trim()}`.trim();
}

export const PROFILE_SETUP_PATH = "/auth/profilni-toldirish" as const;
