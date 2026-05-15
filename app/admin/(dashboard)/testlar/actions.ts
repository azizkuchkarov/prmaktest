"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TestChoice, type Prisma, type TestCatalogCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeTestCatalogCategory } from "@/lib/test-catalog";
import {
  isQuestionComplete,
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
  isPublished: boolean;
  stage: string;
  questions: QuestionDraft[];
};

function toChoice(v: string): TestChoice | null {
  if (v === "A" || v === "B" || v === "C" || v === "D") return v as TestChoice;
  return null;
}

type QuestionRowInsert = Omit<Prisma.QuestionCreateManyInput, "testId">;

function buildQuestionRows(payload: TestSavePayload): QuestionRowInsert[] {
  const complete = payload.questions.filter(isQuestionComplete);
  return complete.map((q, idx) => {
    const c = toChoice(q.correctAnswer);
    if (!c) throw new Error("invalid_choice");
    return {
      order: idx + 1,
      text: q.text.trim(),
      imageUrl: q.imageUrl?.trim() ? q.imageUrl.trim() : null,
      optionA: q.optionA.trim(),
      optionB: q.optionB.trim(),
      optionC: q.optionC.trim(),
      optionD: q.optionD.trim(),
      correctAnswer: c,
      solution: q.solution.trim(),
    };
  });
}

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

  let rows: QuestionRowInsert[];
  try {
    rows = buildQuestionRows(payload);
  } catch {
    return { error: "To'g'ri javob (A–D) noto'g'ri." };
  }

  const stage = payload.stage.trim() || "saralash";
  const catalogCategory = normalizeTestCatalogCategory(String(payload.catalogCategory));

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

  let rows: QuestionRowInsert[];
  try {
    rows = buildQuestionRows(payload);
  } catch {
    return { error: "To'g'ri javob (A–D) noto'g'ri." };
  }

  const stage = payload.stage.trim() || "saralash";
  const catalogCategory = normalizeTestCatalogCategory(String(payload.catalogCategory));

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
