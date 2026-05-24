"use client";

import { useCallback } from "react";
import type { TestRunnerInitialSession } from "@/components/test/TestRunner";
import { TestRunner, type RunnerQuestion } from "@/components/test/TestRunner";
import {
  saveTournamentProgress,
  submitTournamentAttempt,
} from "@/app/turnirlar/[id]/boshlash/actions";

export type TournamentRunnerGateProps = {
  tournamentId: string;
  testId: string;
  title: string;
  durationMinutes: number;
  balanceSum: number;
  priceSum: number;
  questions: RunnerQuestion[];
  initialSession: TestRunnerInitialSession;
};

export function TournamentRunnerGate({
  tournamentId,
  testId,
  title,
  durationMinutes,
  balanceSum,
  priceSum,
  questions,
  initialSession,
}: TournamentRunnerGateProps) {
  const saveProgress = useCallback(
    (id: string, step: number, answers: Record<string, string>) =>
      saveTournamentProgress(tournamentId, step, answers),
    [tournamentId],
  );

  const submitAttempt = useCallback(
    (id: string, answers: Record<string, string>, seconds: number) =>
      submitTournamentAttempt(tournamentId, answers, seconds),
    [tournamentId],
  );

  return (
    <TestRunner
      testId={testId}
      title={title}
      durationMinutes={durationMinutes}
      questions={questions}
      balanceSum={balanceSum}
      priceSum={priceSum}
      isRetake={false}
      initialSession={initialSession}
      saveProgress={saveProgress}
      submitAttempt={submitAttempt}
      sessionBadge="Turnir"
      resultBadge="Turnir natijasi"
      priceLabel="turnir narxi"
      resultPrimaryHref={`/turnirlar/${tournamentId}/reyting`}
      resultPrimaryLabel="Turnir reytingi"
      resultSecondaryHref="/kabinet"
      resultSecondaryLabel="Kabinet"
    />
  );
}
