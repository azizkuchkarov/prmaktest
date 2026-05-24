"use server";

import { revalidatePath } from "next/cache";
import type { TestChoice } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeRankPoints } from "@/lib/rank-points";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { getTournamentPhase, tournamentVisibleForUserGrade } from "@/lib/tournament";
import { formatUzInteger } from "@/lib/format-uzs";
import type { SubmitTestResult, WrongDetail } from "@/app/testlar/[id]/boshlash/actions";

const CHOICES: TestChoice[] = ["A", "B", "C", "D"];
const SUBMIT_GRACE_MS = 120_000;

export type PrepareTournamentSessionResult =
  | {
      ok: true;
      testId: string;
      title: string;
      durationMinutes: number;
      balanceSum: number;
      priceSum: number;
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
        | "grade_gate"
        | "not_live"
        | "already_done"
        | "window_closed"
        | "insufficient";
      message: string;
      balanceSum?: number;
      priceSum?: number;
    };

export async function prepareTournamentSession(
  tournamentId: string,
): Promise<PrepareTournamentSessionResult> {
  const userId = await getStudentSessionUserId();
  if (!userId) {
    return { ok: false, code: "auth", message: "Avval tizimga kiring." };
  }

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, isPublished: true },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          priceSum: true,
          questions: { select: { id: true } },
        },
      },
    },
  });

  if (!tournament) {
    return { ok: false, code: "not_found", message: "Turnir topilmadi." };
  }

  const now = new Date();
  const phase = getTournamentPhase(tournament.startsAt, tournament.endsAt, now);
  if (phase !== "live") {
    return {
      ok: false,
      code: phase === "upcoming" ? "not_live" : "window_closed",
      message:
        phase === "upcoming"
          ? "Turnir hali boshlanmagan. Belgilangan vaqtda qayting."
          : "Turnir vaqti tugagan.",
    };
  }

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { gradeLevel: true },
  });
  if (!profile) {
    return { ok: false, code: "not_found", message: "Foydalanuvchi topilmadi." };
  }

  if (!tournamentVisibleForUserGrade(tournament.examTargetCohort, profile.gradeLevel)) {
    return {
      ok: false,
      code: "grade_gate",
      message: "Bu turnir sizning sinf blokingiz uchun emas.",
    };
  }

  if (tournament.test.questions.length === 0) {
    return { ok: false, code: "no_questions", message: "Turnir testida savollar yo‘q." };
  }

  const existingAttempt = await prisma.tournamentAttempt.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
    select: { id: true },
  });
  if (existingAttempt) {
    return {
      ok: false,
      code: "already_done",
      message: "Siz bu turnirda allaqachon qatnashgansiz.",
    };
  }

  const durationMs = Math.max(1, tournament.test.durationMinutes) * 60 * 1000;
  const maxEndsAt = tournament.endsAt.getTime();
  const testEndsAt = now.getTime() + durationMs;
  const sessionEndsAt = new Date(Math.min(testEndsAt, maxEndsAt));

  const qc = tournament.test.questions.length;
  const listPrice = Math.max(0, tournament.test.priceSum);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balanceSum: true },
      });
      if (!user) throw new Error("user");

      const bal = Number(user.balanceSum ?? 0);

      const existing = await tx.tournamentProgress.findUnique({
        where: { userId_tournamentId: { userId, tournamentId } },
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
            priceSum: listPrice,
            initialSession: {
              endsAtMs: existing.endsAt.getTime(),
              currentStep: Math.max(0, Math.min(existing.currentStep, qc - 1)),
              answers,
            },
          };
        }
        await tx.tournamentProgress.delete({ where: { id: existing.id } });
      }

      const price = listPrice;
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

      await tx.tournamentProgress.create({
        data: {
          userId,
          tournamentId,
          answersJson: "{}",
          currentStep: 0,
          endsAt: sessionEndsAt,
          chargedSum: price,
        },
      });

      const updated = await tx.user.findUnique({
        where: { id: userId },
        select: { balanceSum: true },
      });

      return {
        balanceSum: updated?.balanceSum ?? bal - price,
        priceSum: listPrice,
        initialSession: {
          endsAtMs: sessionEndsAt.getTime(),
          currentStep: 0,
          answers: {} as Record<string, string>,
        },
      };
    });

    return {
      ok: true,
      testId: tournament.test.id,
      title: tournament.title,
      durationMinutes: tournament.test.durationMinutes,
      ...result,
    };
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
    if (e instanceof Error && e.message === "user") {
      return { ok: false, code: "not_found", message: "Foydalanuvchi topilmadi." };
    }
    console.error("[prepareTournamentSession]", e);
    return { ok: false, code: "not_found", message: "Sessiya yaratilmadi." };
  }
}

export async function saveTournamentProgress(
  tournamentId: string,
  currentStep: number,
  answers: Record<string, string>,
): Promise<{ ok: boolean }> {
  const userId = await getStudentSessionUserId();
  if (!userId) return { ok: false };

  const now = new Date();
  const p = await prisma.tournamentProgress.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
  });
  if (!p || p.endsAt <= now) return { ok: false };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { test: { select: { id: true } } },
  });
  if (!tournament) return { ok: false };

  const qc = await prisma.question.count({ where: { testId: tournament.test.id } });
  const step = Math.max(0, Math.min(currentStep, Math.max(0, qc - 1)));

  await prisma.tournamentProgress.update({
    where: { id: p.id },
    data: { currentStep: step, answersJson: JSON.stringify(answers) },
  });
  return { ok: true };
}

export async function submitTournamentAttempt(
  tournamentId: string,
  answers: Record<string, string>,
  clientSecondsUsed: number,
): Promise<SubmitTestResult> {
  const userId = await getStudentSessionUserId();
  if (!userId) return { ok: false, error: "Sessiya topilmadi." };

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, isPublished: true },
    include: {
      test: {
        select: {
          id: true,
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
      },
    },
  });

  if (!tournament) return { ok: false, error: "Turnir topilmadi." };
  if (tournament.test.questions.length === 0) return { ok: false, error: "Savollar yo'q." };

  const now = new Date();
  const phase = getTournamentPhase(tournament.startsAt, tournament.endsAt, now);
  if (phase === "upcoming") {
    return { ok: false, error: "Turnir hali boshlanmagan." };
  }

  const maxSec = tournament.test.durationMinutes * 60 + 120;
  const mergedAnswers = { ...answers };
  let secondsUsed = Math.min(Math.max(0, Math.floor(clientSecondsUsed)), maxSec);

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const existingAttempt = await tx.tournamentAttempt.findUnique({
        where: { userId_tournamentId: { userId, tournamentId } },
        select: { id: true },
      });
      if (existingAttempt) {
        throw new Error("already_done");
      }

      const prog = await tx.tournamentProgress.findUnique({
        where: { userId_tournamentId: { userId, tournamentId } },
      });

      const tournamentGraceEnd = new Date(tournament.endsAt.getTime() + SUBMIT_GRACE_MS);
      const deadlineCutoff = prog
        ? new Date(Math.min(prog.endsAt.getTime() + SUBMIT_GRACE_MS, tournamentGraceEnd.getTime()))
        : new Date(0);

      if (!prog || deadlineCutoff < now) {
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

      const startedAtMs =
        prog.endsAt.getTime() - Math.max(1, tournament.test.durationMinutes) * 60 * 1000;
      secondsUsed = Math.min(
        Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
        maxSec,
      );

      let score = 0;
      const wrong: WrongDetail[] = [];

      for (const q of tournament.test.questions) {
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

      const total = tournament.test.questions.length;
      const rankPoints = computeRankPoints(
        score,
        total,
        secondsUsed,
        tournament.test.durationMinutes,
      );

      const attempt = await tx.tournamentAttempt.create({
        data: {
          userId,
          tournamentId,
          score,
          total,
          secondsUsed,
        },
      });
      await tx.$executeRaw`
        UPDATE "TournamentAttempt" SET "rankPoints" = ${rankPoints} WHERE "id" = ${attempt.id}
      `;

      await tx.tournamentProgress.delete({ where: { id: prog.id } });

      return { score, total, secondsUsed, rankPoints, wrong };
    });

    revalidatePath("/kabinet");
    revalidatePath("/turnirlar");
    revalidatePath(`/turnirlar/${tournamentId}`);
    revalidatePath(`/turnirlar/${tournamentId}/reyting`);

    return {
      ok: true,
      score: outcome.score,
      total: outcome.total,
      secondsUsed: outcome.secondsUsed,
      rankPoints: outcome.rankPoints,
      wrong: outcome.wrong,
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "no_session") {
      return {
        ok: false,
        error: "Turnir sessiyasi topilmadi yoki vaqt tugagan.",
      };
    }
    if (e instanceof Error && e.message === "already_done") {
      return { ok: false, error: "Siz bu turnirda allaqachon qatnashgansiz." };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Natija allaqachon saqlangan." };
    }
    return { ok: false, error: "Natijani saqlab bo‘lmadi." };
  }
}
