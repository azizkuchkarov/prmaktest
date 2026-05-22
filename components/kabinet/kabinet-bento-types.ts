import type {
  ExamSchoolProgram,
  ExamTargetCohort,
  SpecializedSixTrack,
} from "@prisma/client";

export type KabinetBentoNews = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  isRead: boolean;
};

export type KabinetBentoTest = {
  id: string;
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  priceSum: number;
  questionsCount: number;
  stage: string;
  updatedAt: string;
  createdAt: string;
  completed: boolean;
  catalogCategory: string;
  examSchoolProgram: ExamSchoolProgram;
  examTargetCohort: ExamTargetCohort;
  specializedSixTrack: SpecializedSixTrack;
};

export type KabinetBentoStudent = {
  id: string;
  phone: string;
  viloyat: string;
  firstName: string;
  lastName: string;
  parentPhone: string;
  balanceSum: number;
  gradeLevel: number;
  /** Telegram bildirishnomalari — `null` bo‘lsa ulanmagan */
  telegramLinked: boolean;
  telegramUsername: string | null;
};
