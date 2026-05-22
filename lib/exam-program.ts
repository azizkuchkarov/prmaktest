import type {
  ExamSchoolProgram,
  ExamTargetCohort,
  SpecializedSixTrack,
  Test,
} from "@prisma/client";

export type ExamAwareTestPick = Pick<
  Test,
  "examSchoolProgram" | "examTargetCohort" | "specializedSixTrack"
>;

export const EXAM_PROGRAM_ORDER = [
  "PRESIDENT_SCHOOL",
  "SPECIALIZED_SCHOOL",
  "AL_XORAZMIY",
] as const satisfies readonly ExamSchoolProgram[];

export const EXAM_PROGRAM_LABELS: Record<
  ExamSchoolProgram,
  { title: string; subtitle: string }
> = {
  PRESIDENT_SCHOOL: {
    title: "Prezident maktablari",
    subtitle: "4→5 va 6→7 bosqichi test imtihonlari.",
  },
  SPECIALIZED_SCHOOL: {
    title: "Ixtisoslashtirilgan maktablar",
    subtitle:
      "4-sinf blok va 6-sinf blok (aniq va tabiiy fanlar yoʻnalishlarida alohida).",
  },
  AL_XORAZMIY: {
    title: "Al-Xorazmiy maktabi",
    subtitle: "Faqat 4-sinf bloki uchun testlar.",
  },
};

export function isExamSchoolProgram(v: string): v is ExamSchoolProgram {
  return (EXAM_PROGRAM_ORDER as readonly string[]).includes(v);
}

export function normalizeExamSchoolProgram(v: string): ExamSchoolProgram {
  return isExamSchoolProgram(v) ? v : "PRESIDENT_SCHOOL";
}

export function isExamTargetCohort(v: string): v is ExamTargetCohort {
  return v === "COHORT_4_PREP" || v === "COHORT_6_CYCLE";
}

export function normalizeExamTargetCohort(v: string): ExamTargetCohort {
  return isExamTargetCohort(v) ? v : "COHORT_4_PREP";
}

export function isSpecializedSixTrack(v: string): v is SpecializedSixTrack {
  return v === "NONE" || v === "EXACT_SCIENCES" || v === "NATURAL_SCIENCES";
}

export function normalizeSpecializedSixTrack(v: string): SpecializedSixTrack {
  return isSpecializedSixTrack(v) ? v : "NONE";
}

/** 3–4 sinf blokini ko‘radi (tanlovli 6-sinf yoʻq). */
export function viewerUsesElementaryCohort(gradeLevel: number): boolean {
  return gradeLevel <= 4;
}

/** 5–9: 6-sinf sikliga tegishli testlar */
export function viewerUsesUpperCycleCohort(gradeLevel: number): boolean {
  return gradeLevel >= 5 && gradeLevel <= 9;
}

/** 0 yoki boshqa — xavfsiz: kichik blok */
export function examTestVisibleForUserGrade(test: ExamAwareTestPick, gradeLevel: number): boolean {
  if (test.examTargetCohort === "COHORT_4_PREP") {
    return viewerUsesElementaryCohort(gradeLevel) || gradeLevel === 0;
  }
  if (test.examTargetCohort === "COHORT_6_CYCLE") {
    if (!viewerUsesUpperCycleCohort(gradeLevel)) return false;
    if (test.examSchoolProgram === "AL_XORAZMIY") return false;
    return true;
  }
  return false;
}

/** Admin uchun: kombinatsiya qoidalari */
export function validateExamConfig(
  examSchoolProgram: ExamSchoolProgram,
  examTargetCohort: ExamTargetCohort,
  specializedSixTrack: SpecializedSixTrack,
): string | null {
  if (examSchoolProgram === "AL_XORAZMIY") {
    if (examTargetCohort !== "COHORT_4_PREP") {
      return "Al-Xorazmiy uchun faqat 4-sinf bloki tanlanishi mumkin.";
    }
    if (specializedSixTrack !== "NONE") {
      return "Al-Xorazmiy uchun fan yoʻnalishi qoʻllanmaydi.";
    }
  }
  if (examSchoolProgram === "PRESIDENT_SCHOOL") {
    if (specializedSixTrack !== "NONE") {
      return "Prezident maktabi testlarida fan yoʻnalishi tanlanmaydi.";
    }
  }
  if (examSchoolProgram === "SPECIALIZED_SCHOOL") {
    if (examTargetCohort === "COHORT_4_PREP") {
      if (specializedSixTrack !== "NONE") {
        return "4-sinf bloki uchun fan yoʻnalishini tanlash shart emas.";
      }
    } else if (examTargetCohort === "COHORT_6_CYCLE") {
      if (
        specializedSixTrack !== "EXACT_SCIENCES" &&
        specializedSixTrack !== "NATURAL_SCIENCES"
      ) {
        return "Ixtisos maktabda 6-sinf bloki uchun Aniq fanlar yoki Tabiiy fanlar tanlanishi kerak.";
      }
    }
  }
  return null;
}

export function cohortLabelUz(c: ExamTargetCohort): string {
  return c === "COHORT_4_PREP"
    ? "4-sinf bloki · 4→5 tayyori"
    : "6-sinf bloki · 5–9 sinf uchun";
}

export function trackLabelUz(t: SpecializedSixTrack): string {
  if (t === "EXACT_SCIENCES") return "Aniq fanlar";
  if (t === "NATURAL_SCIENCES") return "Tabiiy fanlar";
  return "—";
}

export function examSummaryAdminUz(test: ExamAwareTestPick): string {
  const prog =
    examSchoolProgramLabelShort(test.examSchoolProgram);
  const coh = cohortLabelUz(test.examTargetCohort);
  if (
    test.examSchoolProgram === "SPECIALIZED_SCHOOL" &&
    test.examTargetCohort === "COHORT_6_CYCLE"
  ) {
    return `${prog} · ${coh} · ${trackLabelUz(test.specializedSixTrack)}`;
  }
  return `${prog} · ${coh}`;
}

export function examSchoolProgramLabelShort(p: ExamSchoolProgram): string {
  if (p === "PRESIDENT_SCHOOL") return "Prezident";
  if (p === "SPECIALIZED_SCHOOL") return "Ixtisos";
  return "Al-Xorazmiy";
}
