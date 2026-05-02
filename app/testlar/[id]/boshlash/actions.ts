"use server";

import { revalidatePath } from "next/cache";
import type { TestChoice } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeRankPoints } from "@/lib/rank-points";
import { getStudentSessionUserId } from "@/lib/student-auth";

const CHOICES: TestChoice[] = ["A", "B", "C", "D"];

export type WrongDetail = {
  order: number;
  text: string;
  correct: TestChoice;
  chosen: TestChoice | null;
  solution: string;
};

export type SubmitTestResult =
  | {
      ok: true;
      score: number;
      total: number;
      secondsUsed: number;
      rankPoints: number;
      wrong: WrongDetail[];
    }
  | { ok: false; error: string };

export async function submitTestAttempt(
  testId: string,
  answers: Record<string, string>,
  clientSecondsUsed: number,
): Promise<SubmitTestResult> {
  const userId = await getStudentSessionUserId();
  if (!userId) return { ok: false, error: "Sessiya topilmadi." };

  const test = await prisma.test.findFirst({
    where: { id: testId, isPublished: true },
    select: {
      durationMinutes: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          text: true,
          correctAnswer: true,
          solution: true,
        },
      },
    },
  });

  if (!test) return { ok: false, error: "Test topilmadi." };
  if (test.questions.length === 0) return { ok: false, error: "Savollar yo'q." };

  const maxSec = test.durationMinutes * 60 + 120;
  const secondsUsed = Math.min(Math.max(0, Math.floor(clientSecondsUsed)), maxSec);

  let score = 0;
  const wrong: WrongDetail[] = [];

  for (const q of test.questions) {
    const raw = (answers[q.id] ?? "").trim().toUpperCase();
    const chosen =
      raw && (CHOICES as readonly string[]).includes(raw) ? (raw as TestChoice) : null;
    if (chosen === q.correctAnswer) score++;
    else
      wrong.push({
        order: q.order,
        text: q.text,
        correct: q.correctAnswer,
        chosen,
        solution: q.solution,
      });
  }

  const total = test.questions.length;

  const rankPoints = computeRankPoints(score, total, secondsUsed, test.durationMinutes);

  const attempt = await prisma.testAttempt.create({
    data: { userId, testId, score, total, secondsUsed },
  });
  await prisma.$executeRaw`
    UPDATE "TestAttempt" SET "rankPoints" = ${rankPoints} WHERE "id" = ${attempt.id}
  `;

  revalidatePath("/kabinet");
  revalidatePath(`/testlar/${testId}`);

  return { ok: true, score, total, secondsUsed, rankPoints, wrong };
}
