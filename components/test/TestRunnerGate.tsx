"use client";

import { TestRunner, type RunnerQuestion } from "@/components/test/TestRunner";

export type TestRunnerGateProps = {
  testId: string;
  title: string;
  durationMinutes: number;
  questions: RunnerQuestion[];
};

export function TestRunnerGate(props: TestRunnerGateProps) {
  return <TestRunner {...props} />;
}
