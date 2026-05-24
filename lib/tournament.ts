import type { ExamTargetCohort } from "@prisma/client";
import {
  viewerUsesElementaryCohort,
  viewerUsesUpperCycleCohort,
  cohortLabelUz,
} from "@/lib/exam-program";

export type TournamentPhase = "upcoming" | "live" | "ended";

export function getTournamentPhase(startsAt: Date, endsAt: Date, now = new Date()): TournamentPhase {
  if (now < startsAt) return "upcoming";
  if (now <= endsAt) return "live";
  return "ended";
}

export function tournamentVisibleForUserGrade(cohort: ExamTargetCohort, gradeLevel: number): boolean {
  if (cohort === "COHORT_4_PREP") {
    return viewerUsesElementaryCohort(gradeLevel) || gradeLevel === 0;
  }
  if (cohort === "COHORT_6_CYCLE") {
    return viewerUsesUpperCycleCohort(gradeLevel);
  }
  return false;
}

export function tournamentCohortShortLabel(cohort: ExamTargetCohort): string {
  return cohort === "COHORT_4_PREP" ? "4-sinf" : "6-sinf";
}

export function formatTournamentWindowUz(startsAt: Date, endsAt: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const start = startsAt.toLocaleString("uz-UZ", opts);
  const end = endsAt.toLocaleString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  return `${start} — ${end}`;
}

export function tournamentPhaseLabelUz(phase: TournamentPhase): string {
  if (phase === "upcoming") return "Tez orada";
  if (phase === "live") return "Faol";
  return "Tugagan";
}

export { cohortLabelUz };

/** Admin form: sana + vaqt → Date (mahalliy vaqt) */
export function parseLocalDateTime(dateStr: string, timeStr: string): Date | null {
  const d = dateStr.trim();
  const t = timeStr.trim();
  if (!d || !t) return null;
  const iso = `${d}T${t}:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
