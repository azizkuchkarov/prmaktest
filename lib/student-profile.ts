/** Reytingda ism-familiya va ota-ona raqami to‘liq bo‘lsa — keyingi sahifalarga yo‘l ochiladi. */
export type StudentProfileFields = {
  firstName: string;
  lastName: string;
  parentPhone: string;
};

export function isStudentProfileComplete(p: StudentProfileFields): boolean {
  const fn = p.firstName.trim();
  const ln = p.lastName.trim();
  const pp = p.parentPhone.trim();
  return fn.length >= 2 && ln.length >= 2 && pp.length === 12 && pp.startsWith("998");
}

export function studentDisplayName(p: StudentProfileFields): string {
  return `${p.firstName.trim()} ${p.lastName.trim()}`.trim();
}

export const PROFILE_SETUP_PATH = "/auth/profilni-toldirish" as const;
