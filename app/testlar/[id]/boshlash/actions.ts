"use server";

import { revalidatePath } from "next/cache";
import type { TestChoice } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeRankPoints } from "@/lib/rank-points";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { notifyOfficialTestCompletionTelegram } from "@/lib/telegram-broadcast";
import { formatUzInteger } from "@/lib/format-uzs";
import { examTestVisibleForUserGrade } from "@/lib/exam-program";
import { studentHasVirtualClassAssignmentToTest } from "@/lib/virtual-class-test-access";

const CHOICES: TestChoice[] = ["A", "B", "C", "D"];

const SUBMIT_GRACE_MS = 120_000;

export type WrongDetailOption = {
  letter: TestChoice;
  text: string;
  imageUrl?: string | null;
};

export type WrongDetail = {
  order: number;
  text: string;
  imageUrl?: string | null;
  options: WrongDetailOption[];
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
      /** Reytingda hisoblangan ball (qayta yechishda 0). */
      rankPoints: number;
      wrong: WrongDetail[];
      /** To‘g‘ri: avvalgi rasmiy topshiruvdan keyin — pul yechilmaydi, reyting o‘zgarmaydi. */
      isRetake?: boolean;
    }
  | { ok: false; error: string };

export type PrepareTestSessionResult =
  | {
      ok: true;
      balanceSum: number;
      priceSum: number;
      /** To‘g‘ri bo‘lsa, bu sessiya qayta yechish (narxi ko‘rsatiladi, lekin yechilmaydi). */
      isRetake: boolean;
      initialSession: {
        endsAtMs: number;
        currentStep: number;
        answers: Record<string, string>;
      };
    }
  | {
      ok: false;
      code:
        | "auth"
        | "not_found"
        | "no_questions"
        | "insufficient"
        | "grade_gate";
      message: string;
      balanceSum?: number;
      priceSum?: number;
    };

/**
 * Test sahifasini ochishda: balans tekshiruvi, to‘lov, yoki mavjud sessiyani davom ettirish.
 */
export async function prepareTestSession(testId: string): Promise<PrepareTestSessionResult> {
  const userId = await getStudentSessionUserId();
  if (!userId) {
    return { ok: false, code: "auth", message: "Avval tizimga kiring." };
  }

  const test = await prisma.test.findFirst({
    where: { id: testId, isPublished: true },
    select: {
      id: true,
      durationMinutes: true,
      priceSum: true,
      examSchoolProgram: true,
      examTargetCohort: true,
      specializedSixTrack: true,
    },
  });

  if (!test) {
    return { ok: false, code: "not_found", message: "Test topilmadi." };
  }

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { gradeLevel: true },
  });
  if (!profile) {
    return { ok: false, code: "not_found", message: "Foydalanuvchi topilmadi." };
  }

  const examPick = {
    examSchoolProgram: test.examSchoolProgram,
    examTargetCohort: test.examTargetCohort,
    specializedSixTrack: test.specializedSixTrack,
  };
  const gradeOk = examTestVisibleForUserGrade(examPick, profile.gradeLevel);
  if (!gradeOk) {
    const viaClass = await studentHasVirtualClassAssignmentToTest(userId, test.id);
    if (!viaClass) {
      return {
        ok: false,
        code: "grade_gate",
        message:
          "Bu test sizning sinf uchun mo‘ljallanmagan. Virtual sinfda biriktirilgan bo‘lsa, «Kabinet › Virtual sinflar»dan oching.",
      };
    }
  }

  const qc = await prisma.question.count({ where: { testId: test.id } });
  if (qc === 0) {
    return { ok: false, code: "no_questions", message: "Bu testda savollar yo‘q." };
  }

  const alreadyDone = await prisma.testAttempt.findFirst({
    where: { userId, testId: test.id },
    select: { id: true },
  });
  const isRetake = !!alreadyDone;

  const now = new Date();
  const durationMs = Math.max(1, test.durationMinutes) * 60 * 1000;

  const prismaTx = prisma as unknown as { testProgress?: { create: unknown } };
  if (typeof prismaTx.testProgress?.create !== "function") {
    console.error(
      "[prepareTestSession] Prisma clientda testProgress yo‘q. `npx prisma generate` qiling va dev serverni qayta ishga tushiring.",
    );
    return {
      ok: false,
      code: "not_found",
      message:
        "Server: TestProgress modeli yuklanmadi. Terminalda `npx prisma generate`, so‘ng `next dev` ni qayta ishga tushiring.",
    };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balanceSum: true, gradeLevel: true },
      });
      if (!user) throw new Error("user");

      const bal = Number(user.balanceSum ?? 0);

      const existing = await tx.testProgress.findUnique({
        where: { userId_testId: { userId, testId: test.id } },
      });

      if (existing) {
        if (existing.endsAt > now) {
          let answers: Record<string, string> = {};
          try {
            answers = JSON.parse(existing.answersJson || "{}") as Record<string, string>;
          } catch {
            answers = {};
          }
          return {
            balanceSum: bal,
            priceSum: test.priceSum,
            isRetake,
            initialSession: {
              endsAtMs: existing.endsAt.getTime(),
              currentStep: Math.max(0, Math.min(existing.currentStep, qc - 1)),
              answers,
            },
          };
        }
        await tx.testProgress.delete({ where: { id: existing.id } });
      }

      const price = isRetake ? 0 : Math.max(0, test.priceSum);
      if (price > 0 && bal < price) {
        throw Object.assign(new Error("insufficient"), {
          balanceSum: bal,
          priceSum: price,
        });
      }

      if (price > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { balanceSum: { decrement: price } },
        });
      }

      const endsAt = new Date(now.getTime() + durationMs);
      await tx.testProgress.create({
        data: {
          userId,
          testId: test.id,
          answersJson: "{}",
          currentStep: 0,
          endsAt,
          chargedSum: price,
        },
      });

      const updated = await tx.user.findUnique({
        where: { id: userId },
        select: { balanceSum: true },
      });

      return {
        balanceSum: updated?.balanceSum ?? bal - price,
        priceSum: test.priceSum,
        isRetake,
        initialSession: {
          endsAtMs: endsAt.getTime(),
          currentStep: 0,
          answers: {} as Record<string, string>,
        },
      };
    },
      { maxWait: 10_000, timeout: 20_000 },
    );

    /** RSC render ichida `revalidatePath` taqiq; /kabinet `force-dynamic`. */
    return { ok: true, ...result };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "balanceSum" in e && "priceSum" in e) {
      const b = e as { balanceSum: number; priceSum: number };
      return {
        ok: false,
        code: "insufficient",
        message: `Balans yetarli emas. Kerak: ${formatUzInteger(b.priceSum)} so'm.`,
        balanceSum: b.balanceSum,
        priceSum: b.priceSum,
      };
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[prepareTestSession] Prisma", e.code, e.message, e.meta);
      if (e.code === "P2021") {
        return {
          ok: false,
          code: "not_found",
          message: "Bazada TestProgress jadvali yo‘q. `npx prisma migrate deploy` ni ishga tushiring.",
        };
      }
      if (e.code === "P2022") {
        return {
          ok: false,
          code: "not_found",
          message: "Bazada ustunlar Prisma sxemasi bilan mos emas. `migrate deploy` va `prisma generate` qiling.",
        };
      }
      if (e.code === "P2002") {
        return {
          ok: false,
          code: "not_found",
          message: "Sessiya allaqachon mavjud. Sahifani yangilab qayta urinib ko‘ring.",
        };
      }
    } else if (e instanceof Error && e.message === "user") {
      return { ok: false, code: "not_found", message: "Hisobingiz bazadan topilmadi. Qayta kiring." };
    } else if (e instanceof Prisma.PrismaClientValidationError) {
      console.error("[prepareTestSession] validation", e.message);
    } else {
      console.error("[prepareTestSession]", e);
    }

    return { ok: false, code: "not_found", message: "Sessiya yaratilmadi. Qayta urinib ko‘ring." };
  }
}

export async function saveTestProgress(
  testId: string,
  currentStep: number,
  answers: Record<string, string>,
): Promise<{ ok: boolean }> {
  const userId = await getStudentSessionUserId();
  if (!userId) return { ok: false };

  const now = new Date();
  const p = await prisma.testProgress.findUnique({
    where: { userId_testId: { userId, testId } },
  });
  if (!p || p.endsAt <= now) return { ok: false };

  const qc = await prisma.question.count({ where: { testId } });
  const step = Math.max(0, Math.min(currentStep, Math.max(0, qc - 1)));

  await prisma.testProgress.update({
    where: { id: p.id },
    data: {
      currentStep: step,
      answersJson: JSON.stringify(answers),
    },
  });
  return { ok: true };
}

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
      title: true,
      durationMinutes: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          text: true,
          imageUrl: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          optionAImageUrl: true,
          optionBImageUrl: true,
          optionCImageUrl: true,
          optionDImageUrl: true,
          correctAnswer: true,
          solution: true,
        },
      },
    },
  });

  if (!test) return { ok: false, error: "Test topilmadi." };
  if (test.questions.length === 0) return { ok: false, error: "Savollar yo'q." };

  const maxSec = test.durationMinutes * 60 + 120;

  const mergedAnswers = { ...answers };
  let secondsUsed = Math.min(Math.max(0, Math.floor(clientSecondsUsed)), maxSec);

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const existingAttempt = await tx.testAttempt.findFirst({
        where: { userId, testId },
        select: { id: true },
      });

      const prog = await tx.testProgress.findUnique({
        where: { userId_testId: { userId, testId } },
      });

      const deadlineCutoff = prog
        ? new Date(prog.endsAt.getTime() + SUBMIT_GRACE_MS)
        : new Date(0);

      if (!prog || deadlineCutoff < new Date()) {
        throw new Error("no_session");
      }

      let stored: Record<string, string> = {};
      try {
        stored = JSON.parse(prog.answersJson || "{}") as Record<string, string>;
      } catch {
        stored = {};
      }
      Object.assign(mergedAnswers, stored);
      for (const k of Object.keys(answers)) {
        mergedAnswers[k] = answers[k];
      }

      const startedAtMs = prog.endsAt.getTime() - Math.max(1, test.durationMinutes) * 60 * 1000;
      secondsUsed = Math.min(
        Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
        maxSec,
      );

      let score = 0;
      const wrong: WrongDetail[] = [];

      for (const q of test.questions) {
        const raw = (mergedAnswers[q.id] ?? "").trim().toUpperCase();
        const chosen =
          raw && (CHOICES as readonly string[]).includes(raw) ? (raw as TestChoice) : null;
        if (chosen === q.correctAnswer) score++;
        else
          wrong.push({
            order: q.order,
            text: q.text,
            imageUrl: q.imageUrl,
            options: [
              { letter: "A", text: q.optionA, imageUrl: q.optionAImageUrl },
              { letter: "B", text: q.optionB, imageUrl: q.optionBImageUrl },
              { letter: "C", text: q.optionC, imageUrl: q.optionCImageUrl },
              { letter: "D", text: q.optionD, imageUrl: q.optionDImageUrl },
            ],
            correct: q.correctAnswer,
            chosen,
            solution: q.solution,
          });
      }

      const total = test.questions.length;

      if (existingAttempt) {
        await tx.testProgress.delete({ where: { id: prog.id } });
        return {
          score,
          total,
          secondsUsed,
          rankPoints: 0,
          wrong,
          isRetake: true as const,
        };
      }

      const rankPoints = computeRankPoints(score, total, secondsUsed, test.durationMinutes);

      const attempt = await tx.testAttempt.create({
        data: { userId, testId, score, total, secondsUsed },
      });
      await tx.$executeRaw`
        UPDATE "TestAttempt" SET "rankPoints" = ${rankPoints} WHERE "id" = ${attempt.id}
      `;

      await tx.testProgress.delete({ where: { id: prog.id } });

      return { score, total, secondsUsed, rankPoints, wrong, isRetake: false as const };
    });

    revalidatePath("/kabinet");
    revalidatePath(`/testlar/${testId}`);

    if (outcome.isRetake === false) {
      try {
        await notifyOfficialTestCompletionTelegram({
          userId,
          testId,
          testTitle: test.title,
          score: outcome.score,
          total: outcome.total,
          secondsUsed: outcome.secondsUsed,
          rankPoints: outcome.rankPoints,
        });
      } catch (e) {
        console.error("[telegram-test-complete] Ichki xato:", e);
      }
    }

    return {
      ok: true,
      score: outcome.score,
      total: outcome.total,
      secondsUsed: outcome.secondsUsed,
      rankPoints: outcome.rankPoints,
      wrong: outcome.wrong,
      ...(outcome.isRetake ? { isRetake: true } : {}),
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "no_session") {
      return {
        ok: false,
        error:
          "Test sessiyasi topilmadi yoki vaqt tugagan. Sahifani yangilab, testni qayta boshlang (pull yana yechilishi mumkin).",
      };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      revalidatePath("/kabinet");
      revalidatePath(`/testlar/${testId}`);
      return {
        ok: false,
        error:
          "Bu test bo‘yicha natija allaqachon saqlangan. Qayta topshirish mumkin emas.",
      };
    }
    return { ok: false, error: "Natijani saqlab bo‘lmadi." };
  }
}
