"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ExamTargetCohort } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isExamTargetCohort } from "@/lib/exam-program";
import { parseLocalDateTime } from "@/lib/tournament";
import { validateTestQuestions, type QuestionDraft } from "@/lib/test-builder-rules";
import { buildQuestionRows } from "@/lib/test-question-rows";

export type ActionState = { error?: string } | undefined;

export type TournamentSavePayload = {
  title: string;
  examTargetCohort: ExamTargetCohort;
  durationMinutes: number;
  priceSum: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isPublished: boolean;
  questions: QuestionDraft[];
};

function parsePayload(payload: TournamentSavePayload) {
  const title = payload.title.trim();
  const cohortRaw = payload.examTargetCohort;
  const startsAt = parseLocalDateTime(payload.startDate, payload.startTime);
  const endsAt = parseLocalDateTime(payload.endDate, payload.endTime);
  const dm = Math.round(Number(payload.durationMinutes));
  const priceSum = Math.round(Number(payload.priceSum));
  return {
    title,
    cohortRaw,
    startsAt,
    endsAt,
    dm,
    priceSum,
    published: payload.isPublished,
    questions: payload.questions,
  };
}

async function validatePayload(
  title: string,
  cohortRaw: string,
  startsAt: Date | null,
  endsAt: Date | null,
  dm: number,
  priceSum: number,
  questions: QuestionDraft[],
): Promise<
  | { error: string }
  | {
      examTargetCohort: ExamTargetCohort;
      startsAt: Date;
      endsAt: Date;
      durationMinutes: number;
      priceSum: number;
      questionRows: ReturnType<typeof buildQuestionRows>;
    }
> {
  if (!title) return { error: "Turnir nomi majburiy." };
  if (!isExamTargetCohort(cohortRaw)) return { error: "Sinf bloki tanlanishi kerak." };
  if (!startsAt || !endsAt) return { error: "Boshlanish va tugash vaqti to‘g‘ri kiriting." };
  if (endsAt <= startsAt) return { error: "Tugash vaqti boshlanishdan keyin bo‘lishi kerak." };
  if (!Number.isFinite(dm) || dm < 1) return { error: "Test vaqti (daqiqa) noto‘g‘ri." };
  if (!Number.isFinite(priceSum) || priceSum < 0) return { error: "Turnir narxi (so'm) noto'g'ri." };

  const qErr = validateTestQuestions(questions);
  if (qErr) return { error: qErr };

  let questionRows;
  try {
    questionRows = buildQuestionRows(questions);
  } catch {
    return { error: "To‘g‘ri javob (A–D) noto‘g‘ri." };
  }

  return {
    examTargetCohort: cohortRaw,
    startsAt,
    endsAt,
    durationMinutes: dm,
    priceSum,
    questionRows,
  };
}

function revalidateTournamentPaths(id?: string) {
  revalidatePath("/turnirlar");
  revalidatePath("/admin/turnirlar");
  revalidatePath("/kabinet");
  if (id) {
    revalidatePath(`/turnirlar/${id}`);
    revalidatePath(`/turnirlar/${id}/reyting`);
    revalidatePath(`/turnirlar/${id}/boshlash`);
  }
}

export async function createTournamentWithTest(payload: TournamentSavePayload): Promise<ActionState> {
  const { title, cohortRaw, startsAt, endsAt, dm, priceSum, published, questions } =
    parsePayload(payload);
  const validated = await validatePayload(title, cohortRaw, startsAt, endsAt, dm, priceSum, questions);
  if ("error" in validated) return { error: validated.error };

  await prisma.$transaction(async (tx) => {
    const test = await tx.test.create({
      data: {
        title: `[Turnir] ${title}`,
        subject: "Turnir",
        description: "Faqat turnir uchun — katalogda ko‘rinmaydi.",
        durationMinutes: validated.durationMinutes,
        priceSum: validated.priceSum,
        questionsCount: validated.questionRows.length,
        catalogCategory: "MOCK",
        examSchoolProgram: "PRESIDENT_SCHOOL",
        examTargetCohort: validated.examTargetCohort,
        specializedSixTrack: "NONE",
        isPublished: false,
        isTournamentOnly: true,
        stage: "turnir",
      },
    });
    await tx.question.createMany({
      data: validated.questionRows.map((r) => ({ ...r, testId: test.id })),
    });
    await tx.tournament.create({
      data: {
        title,
        examTargetCohort: validated.examTargetCohort,
        testId: test.id,
        startsAt: validated.startsAt,
        endsAt: validated.endsAt,
        isPublished: published,
      },
    });
  });

  revalidateTournamentPaths();
  redirect("/admin/turnirlar");
}

export async function updateTournamentWithTest(
  id: string,
  payload: TournamentSavePayload,
): Promise<ActionState> {
  const { title, cohortRaw, startsAt, endsAt, dm, priceSum, published, questions } =
    parsePayload(payload);
  const validated = await validatePayload(title, cohortRaw, startsAt, endsAt, dm, priceSum, questions);
  if ("error" in validated) return { error: validated.error };

  const existing = await prisma.tournament.findUnique({
    where: { id },
    include: { test: { select: { id: true, isTournamentOnly: true } } },
  });
  if (!existing) return { error: "Turnir topilmadi." };
  if (!existing.test.isTournamentOnly) {
    return { error: "Bu turnir eski formatda — alohida test yuklash uchun qayta yarating." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.test.update({
      where: { id: existing.testId },
      data: {
        title: `[Turnir] ${title}`,
        durationMinutes: validated.durationMinutes,
        priceSum: validated.priceSum,
        questionsCount: validated.questionRows.length,
        examTargetCohort: validated.examTargetCohort,
      },
    });
    await tx.question.deleteMany({ where: { testId: existing.testId } });
    await tx.question.createMany({
      data: validated.questionRows.map((r) => ({ ...r, testId: existing.testId })),
    });
    await tx.tournament.update({
      where: { id },
      data: {
        title,
        examTargetCohort: validated.examTargetCohort,
        startsAt: validated.startsAt,
        endsAt: validated.endsAt,
        isPublished: published,
      },
    });
  });

  revalidateTournamentPaths(id);
  redirect("/admin/turnirlar");
}

export async function deleteTournament(id: string) {
  const existing = await prisma.tournament.findUnique({
    where: { id },
    select: { testId: true, test: { select: { isTournamentOnly: true } } },
  });
  if (!existing) redirect("/admin/turnirlar");

  const testId = existing.testId;
  const tournamentOnly = existing.test.isTournamentOnly;

  await prisma.tournament.delete({ where: { id } });

  if (tournamentOnly) {
    await prisma.test.delete({ where: { id: testId } });
  }

  revalidateTournamentPaths();
  redirect("/admin/turnirlar");
}
