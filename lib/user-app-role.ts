import type { AppUserRole } from "@prisma/client";

export const STUDENT_LOGIN_HOME = "/kabinet";
export const TEACHER_LOGIN_HOME = "/oqituvchi";
export const TEACHER_PENDING_PATH = "/oqituvchi/kutilmoqda";

export function isStudentRole(r: AppUserRole): boolean {
  return r === "STUDENT";
}

export function isTeacherPendingRole(r: AppUserRole): boolean {
  return r === "TEACHER_PENDING";
}

export function isApprovedTeacherRole(r: AppUserRole): boolean {
  return r === "TEACHER";
}

/** O‘qituvchi kabinetiga kirish (tasdiqlangan yoki eski TEACHER_PENDING yozuvlar). */
export function isTeacherRole(r: AppUserRole): boolean {
  return r === "TEACHER" || r === "TEACHER_PENDING";
}
