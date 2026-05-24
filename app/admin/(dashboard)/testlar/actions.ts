"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildQuestionRows } from "@/lib/test-question-rows";
import type { TestCatalogCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeTestCatalogCategory } from "@/lib/test-catalog";
import {
  normalizeExamSchoolProgram,
  normalizeExamTargetCohort,
  normalizeSpecializedSixTrack,
  validateExamConfig,
} from "@/lib/exam-program";
import {
  validateTestQuestions,
  type QuestionDraft,
} from "@/lib/test-builder-rules";
import { notifyTelegramTestPublished } from "@/lib/telegram-broadcast";

export type TestActionState = { error?: string } | undefined;

export type TestSavePayload = {
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  /** So'm (0 = bepul) */
  priceSum: number;
  /** Kabinetda qaysi katalog blokida */
  catalogCategory: TestCatalogCategory;
  examSchoolProgram: string;
  examTargetCohort: string;
  specializedSixTrack: string;
  isPublished: boolean;
  stage: string;
  questions: QuestionDraft[];
};

export async function createTestFull(payload: TestSavePayload): Promise<TestActionState> {
  const title = payload.title.trim();
  if (!title) return { error: "Test nomi majburiy." };
  const subject = payload.subject.trim();
  const description = payload.description.trim();
  const dm = Math.round(Number(payload.durationMinutes));
  if (!Number.isFinite(dm) || dm < 1) return { error: "Vaqt (daqiqa) noto'g'ri." };
  const priceSum = Math.round(Number(payload.priceSum));
  if (!Number.isFinite(priceSum) || priceSum < 0) return { error: "Narx (so'm) noto'g'ri." };

  const err = validateTestQuestions(payload.questions);
  if (err) return { error: err };

  let rows;
  try {
    rows = buildQuestionRows(payload.questions);
  } catch {
    return { error: "To'g'ri javob (A–D) noto'g'ri." };
  }

  const stage = payload.stage.trim() || "saralash";
  const catalogCategory = normalizeTestCatalogCategory(String(payload.catalogCategory));
  const examSchoolProgram = normalizeExamSchoolProgram(String(payload.examSchoolProgram));
  const examTargetCohort = normalizeExamTargetCohort(String(payload.examTargetCohort));
  const specializedSixTrack = normalizeSpecializedSixTrack(String(payload.specializedSixTrack));
  const examErr = validateExamConfig(examSchoolProgram, examTargetCohort, specializedSixTrack);
  if (examErr) return { error: examErr };

  const created = await prisma.$transaction(async (tx) => {
    const test = await tx.test.create({
      data: {
        title,
        subject,
        description,
        durationMinutes: dm,
        priceSum,
        questionsCount: rows.length,
        catalogCategory,
        examSchoolProgram,
        examTargetCohort,
        specializedSixTrack,
        isPublished: payload.isPublished,
        stage,
      },
    });
    await tx.question.createMany({
      data: rows.map((r) => ({ ...r, testId: test.id })),
    });
    return test;
  });

  revalidatePath("/testlar");
  revalidatePath("/kabinet");
  revalidatePath("/admin/testlar");

  if (created.isPublished) {
    try {
      await notifyTelegramTestPublished(created.id, created.title);
    } catch {
      /* ignore */
    }
  }

  redirect("/admin/testlar");
}

export async function updateTestFull(
  testId: string,
  payload: TestSavePayload,
): Promise<TestActionState> {
  const title = payload.title.trim();
  if (!title) return { error: "Test nomi majburiy." };
  const subject = payload.subject.trim();
  const description = payload.description.trim();
  const dm = Math.round(Number(payload.durationMinutes));
  if (!Number.isFinite(dm) || dm < 1) return { error: "Vaqt (daqiqa) noto'g'ri." };
  const priceSum = Math.round(Number(payload.priceSum));
  if (!Number.isFinite(priceSum) || priceSum < 0) return { error: "Narx (so'm) noto'g'ri." };

  const err = validateTestQuestions(payload.questions);
  if (err) return { error: err };

  let rows;
  try {
    rows = buildQuestionRows(payload.questions);
  } catch {
    return { error: "To'g'ri javob (A–D) noto'g'ri." };
  }

  const stage = payload.stage.trim() || "saralash";
  const catalogCategory = normalizeTestCatalogCategory(String(payload.catalogCategory));
  const examSchoolProgram = normalizeExamSchoolProgram(String(payload.examSchoolProgram));
  const examTargetCohort = normalizeExamTargetCohort(String(payload.examTargetCohort));
  const specializedSixTrack = normalizeSpecializedSixTrack(String(payload.specializedSixTrack));
  const examErr = validateExamConfig(examSchoolProgram, examTargetCohort, specializedSixTrack);
  if (examErr) return { error: examErr };

  const prev = await prisma.test.findUnique({
    where: { id: testId },
    select: { isPublished: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.question.deleteMany({ where: { testId } });
    await tx.test.update({
      where: { id: testId },
      data: {
        title,
        subject,
        description,
        durationMinutes: dm,
        priceSum,
        questionsCount: rows.length,
        catalogCategory,
        examSchoolProgram,
        examTargetCohort,
        specializedSixTrack,
        isPublished: payload.isPublished,
        stage,
      },
    });
    if (rows.length > 0) {
      await tx.question.createMany({
        data: rows.map((r) => ({ ...r, testId })),
      });
    }
  });

  const becamePublished = payload.isPublished && !prev?.isPublished;

  revalidatePath("/testlar");
  revalidatePath("/kabinet");
  revalidatePath("/admin/testlar");

  if (becamePublished) {
    try {
      await notifyTelegramTestPublished(testId, title);
    } catch {
      /* ignore */
    }
  }

  redirect("/admin/testlar");
}

export async function deleteTest(id: string) {
  await prisma.test.delete({ where: { id } });
  revalidatePath("/testlar");
  revalidatePath("/kabinet");
  revalidatePath("/admin/testlar");
  redirect("/admin/testlar");
}
