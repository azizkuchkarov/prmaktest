"use client";

import type { TestRunnerInitialSession } from "@/components/test/TestRunner";
import { TestRunner, type RunnerQuestion } from "@/components/test/TestRunner";

export type { TestRunnerInitialSession };

export type TestRunnerGateProps = {
  testId: string;
  title: string;
  durationMinutes: number;
  questions: RunnerQuestion[];
  balanceSum: number;
  priceSum: number;
  /** Avvalgi rasmiy topshiruvdan keyin — pul yechilmaydi, natijada reyting balli qo‘shilmaydi. */
  isRetake?: boolean;
  initialSession: TestRunnerInitialSession;
};

export function TestRunnerGate(props: TestRunnerGateProps) {
  return <TestRunner {...props} isRetake={props.isRetake ?? false} />;
}
