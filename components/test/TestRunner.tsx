"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { submitTestAttempt, type SubmitTestResult } from "@/app/testlar/[id]/boshlash/actions";

export type RunnerQuestion = {
  id: string;
  order: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type Props = {
  testId: string;
  title: string;
  durationMinutes: number;
  questions: RunnerQuestion[];
};

function formatMmSs(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function TestRunner({ testId, title, durationMinutes, questions }: Props) {
  const totalSeconds = Math.max(durationMinutes, 1) * 60;
  /**
   * Deadline faqat client `useEffect`da — SSR va birinchi client render bir xil
   * `totalSeconds` ko‘rsatadi (hydration buzilmasin); iOS’dagi “muskul” UI uchun muhim.
   */
  const [clientDeadlineMs, setClientDeadlineMs] = useState<number | null>(null);

  const [timerTick, setTimerTick] = useState(0);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitTestResult | null>(null);
  const [wrongStep, setWrongStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAtMsRef = useRef(0);
  const finishedRef = useRef(false);
  /** Faqat `pickAnswer` yangilaydi — `= answers` har renderda refni buzmasin */
  const answersRef = useRef<Record<string, string>>({});

  const totalQ = questions.length;
  const current = questions[step];

  const secondsLeft =
    clientDeadlineMs === null
      ? totalSeconds
      : Math.max(0, Math.ceil((clientDeadlineMs - Date.now()) / 1000));

  useEffect(() => {
    const now = Date.now();
    startedAtMsRef.current = now;
    setClientDeadlineMs(now + totalSeconds * 1000);
    setTimerTick((t) => t + 1);
  }, [totalSeconds]);

  const runSubmit = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const used = Math.floor((Date.now() - (startedAtMsRef.current || Date.now())) / 1000);
    setIsSubmitting(true);
    void submitTestAttempt(testId, answersRef.current, used)
      .then(setResult)
      .finally(() => setIsSubmitting(false));
  }, [testId]);

  useEffect(() => {
    if (result || clientDeadlineMs === null) return;
    const id = window.setInterval(() => setTimerTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [result, clientDeadlineMs]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") setTimerTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (result || isSubmitting) return;
    if (secondsLeft > 0) return;
    runSubmit();
  }, [timerTick, secondsLeft, result, isSubmitting, runSubmit]);

  const pickAnswerSigRef = useRef<{ t: number; sig: string }>({ t: 0, sig: "" });

  /** Mobil WebKit: click + touchend ikkalasi kelishi mumkin; bir xil tanlovni qisqa vaqt ichida ikki marta yozmaymiz */
  const pickAnswer = useCallback((questionId: string, letter: string) => {
    const id = String(questionId);
    const sig = `${id}:${letter}`;
    const now = Date.now();
    const prev = pickAnswerSigRef.current;
    if (prev.sig === sig && now - prev.t < 450) return;
    pickAnswerSigRef.current = { t: now, sig };
    setAnswers((prev) => {
      const next = { ...prev, [id]: letter };
      answersRef.current = next;
      return next;
    });
  }, []);

  const optionTouchRef = useRef<{ ky: string; y: number } | null>(null);

  const goNext = useCallback(() => {
    if (result || isSubmitting) return;
    setStep((s) => {
      const q = questions[s];
      if (!q) return s;
      const qid = String(q.id);
      const chosen = answersRef.current[qid];
      if (!chosen) return s;
      if (s < totalQ - 1) return s + 1;
      queueMicrotask(() => runSubmit());
      return s;
    });
  }, [result, isSubmitting, questions, totalQ, runSubmit]);

  const goPrev = useCallback(() => {
    if (result || isSubmitting) return;
    if (step > 0) setStep((s) => s - 1);
  }, [result, isSubmitting, step]);

  if (result?.ok) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const wrong = result.wrong;
    const w = wrong[wrongStep];

    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:rounded-3xl sm:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-emerald-700">Natija</p>
            <h1 className="mt-2 text-center text-lg font-bold leading-snug text-slate-900 sm:text-2xl">{title}</h1>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
              <div className="min-w-0 rounded-xl bg-slate-50/80 px-1 py-2 sm:rounded-none sm:bg-transparent sm:p-0">
                <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-4xl">
                  {result.score}/{result.total}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">{"To'g'ri"}</p>
              </div>
              <div className="hidden h-10 w-px bg-slate-200 sm:block" aria-hidden />
              <div className="min-w-0 rounded-xl bg-slate-50/80 px-1 py-2 sm:rounded-none sm:bg-transparent sm:p-0">
                <p className="text-xl font-bold tabular-nums text-emerald-700 sm:text-4xl">{pct}%</p>
                <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">Foiz</p>
              </div>
              <div className="hidden h-10 w-px bg-slate-200 sm:block" aria-hidden />
              <div className="min-w-0 rounded-xl bg-amber-50/80 px-1 py-2 sm:rounded-none sm:bg-transparent sm:p-0">
                <p className="text-xl font-bold tabular-nums text-amber-600 sm:text-4xl">+{result.rankPoints}</p>
                <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">Ball</p>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-slate-600">
              Sarflangan vaqt: <span className="font-semibold text-slate-900">{formatMmSs(result.secondsUsed)}</span>
            </p>
          </div>

          {wrong.length > 0 ? (
            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/90 p-5 shadow-md sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-amber-950">Tushuntirish</h2>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-amber-900 shadow-sm">
                  {wrongStep + 1} / {wrong.length}
                </span>
              </div>
              {w ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold leading-snug text-slate-900">
                    {w.order}. {w.text}
                  </p>
                  <p className="text-xs text-slate-700">
                    {"Sizning javobingiz: "}
                    <span className="font-bold text-slate-900">{w.chosen ?? "—"}</span>
                    {" · To'g'ri: "}
                    <span className="font-bold text-emerald-700">{w.correct}</span>
                  </p>
                  <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Yechim</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {w.solution || "Tushuntirish kiritilmagan."}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-between gap-2 sm:gap-3">
                <button
                  type="button"
                  disabled={wrongStep <= 0}
                  onClick={() => setWrongStep((i) => Math.max(0, i - 1))}
                  className="min-h-12 min-w-[6.5rem] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 sm:flex-none sm:min-h-11 sm:py-2.5"
                >
                  Oldingi
                </button>
                <button
                  type="button"
                  disabled={wrongStep >= wrong.length - 1}
                  onClick={() => setWrongStep((i) => Math.min(wrong.length - 1, i + 1))}
                  className="min-h-12 min-w-[6.5rem] flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-md active:brightness-95 disabled:opacity-40 sm:flex-none sm:min-h-11 sm:py-2.5"
                >
                  Keyingi xato
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-8 text-center text-sm font-semibold text-emerald-700">{"Barcha savollar to'g'ri!"}</p>
          )}

          <div className="mt-8 flex flex-col gap-2 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Link
              href="/kabinet"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:brightness-105 active:brightness-95"
            >
              Kabinetga qaytish
            </Link>
            <Link
              href={`/testlar/${testId}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:bg-slate-100"
            >
              Test sahifasi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result && !result.ok) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white px-3 py-8 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50/80 p-5 sm:p-6">
          <p className="text-sm font-medium text-red-800">{result.error}</p>
          <Link href="/kabinet" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Kabinetga qaytish
          </Link>
        </div>
      </div>
    );
  }

  const progress = totalQ > 0 ? Math.round(((step + 1) / totalQ) * 100) : 0;
  const qid = current ? String(current.id) : "";
  const chosenForCurrent = qid ? answers[qid] : undefined;

  if (!current) return null;

  const prevLocked = step === 0 || isSubmitting;

  return (
    <div className="relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 text-slate-900 [-webkit-tap-highlight-color:transparent]">
      <header className="relative z-20 shrink-0 border-b border-slate-200/90 bg-white pt-[max(0px,env(safe-area-inset-top))] shadow-sm">
        <div className="mx-auto max-w-lg px-4 py-3 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Aktiv test</p>
              <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-slate-900">{title}</p>
            </div>
            <div
              className={`shrink-0 rounded-2xl px-3 py-2 text-center shadow-inner ${
                secondsLeft <= 60
                  ? "bg-red-50 text-red-800 ring-2 ring-red-200"
                  : "bg-slate-100 text-slate-900 ring-1 ring-slate-200/80"
              }`}
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Qoldi</p>
              <p className="text-base font-black tabular-nums leading-none">{formatMmSs(secondsLeft)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold">
            <Link href={`/testlar/${testId}`} className="truncate text-emerald-800 hover:underline">
              ← Test haqida
            </Link>
            <Link href="/kabinet" className="shrink-0 text-slate-600 hover:text-slate-900">
              Kabinet
            </Link>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>
                Savol {step + 1} / {totalQ}
              </span>
              <span className="tabular-nums text-emerald-800">{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* fixed footer iOS’da ba’zan butun sahifa uchun hit-test buzadi — flex oqim + scroll */}
      <main className="relative z-10 flex-1 px-4 pb-4 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md shadow-slate-200/50 ring-1 ring-slate-100 sm:rounded-3xl sm:p-7">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-900 ring-1 ring-emerald-200/80">
                {current.order}
              </span>
              <p className="min-w-0 text-[15px] font-semibold leading-relaxed tracking-tight text-slate-900 sm:text-base">
                {current.text}
              </p>
            </div>

            <div
              key={current.id}
              className="mt-5 space-y-3 sm:mt-6"
              role="group"
              aria-label="Javob variantlari"
            >
              {(
                [
                  ["A", current.optionA],
                  ["B", current.optionB],
                  ["C", current.optionC],
                  ["D", current.optionD],
                ] as const
              ).map(([letter, label]) => {
                const selected = chosenForCurrent === letter;
                const optKy = `${String(current.id)}|${letter}`;
                return (
                  <button
                    key={letter}
                    type="button"
                    aria-checked={selected}
                    aria-label={`Javob ${letter}: ${label}`}
                    onClick={() => pickAnswer(String(current.id), letter)}
                    onTouchStart={(e) => {
                      const y = e.touches[0]?.clientY;
                      if (y === undefined) return;
                      optionTouchRef.current = { ky: optKy, y };
                    }}
                    onTouchCancel={() => {
                      const t = optionTouchRef.current;
                      if (t?.ky === optKy) optionTouchRef.current = null;
                    }}
                    onTouchEnd={(e) => {
                      const t = optionTouchRef.current;
                      const y = e.changedTouches[0]?.clientY;
                      optionTouchRef.current = null;
                      if (!t || t.ky !== optKy || y === undefined) return;
                      if (Math.abs(y - t.y) > 28) return;
                      pickAnswer(String(current.id), letter);
                    }}
                    className={`touch-manipulation flex min-h-[3.5rem] w-full cursor-pointer select-none items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left text-sm font-medium transition-colors duration-150 sm:min-h-[3.25rem] sm:px-4 ${
                      selected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/60"
                        : "border-slate-200 bg-white text-slate-800 shadow-sm active:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`pointer-events-none flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                        selected ? "bg-white/95 ring-2 ring-white/70" : "bg-slate-100 ring-1 ring-slate-200/80"
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selected ? "border-white bg-emerald-600" : "border-slate-400 bg-white"
                        }`}
                      >
                        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                      </span>
                    </span>
                    <span
                      className={`pointer-events-none min-w-0 flex-1 leading-snug ${selected ? "text-white" : "text-slate-800"}`}
                    >
                      <span
                        className={`mr-2 inline-block font-black tabular-nums ${selected ? "text-emerald-100" : "text-emerald-700"}`}
                      >
                        {letter}.
                      </span>
                      {label}
                    </span>
                    {selected ? (
                      <span
                        className="pointer-events-none flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg font-bold text-white ring-1 ring-white/50"
                        aria-hidden
                      >
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-30 mt-auto shrink-0 border-t border-slate-200/90 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(15,23,42,0.08)] sm:px-6">
        <div className="mx-auto flex max-w-lg items-stretch gap-3 [touch-action:manipulation]">
          <button
            type="button"
            aria-disabled={prevLocked}
            onClick={() => {
              if (prevLocked) return;
              goPrev();
            }}
            className={`touch-manipulation min-h-[3.25rem] min-w-[6.5rem] flex-1 rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 ${prevLocked ? "pointer-events-none cursor-not-allowed opacity-40" : "cursor-pointer active:bg-slate-100"}`}
          >
            Oldingi
          </button>
          <button
            type="button"
            aria-disabled={isSubmitting}
            onClick={() => {
              if (isSubmitting) return;
              goNext();
            }}
            className={`touch-manipulation min-h-[3.25rem] min-w-[10rem] flex-1 rounded-2xl px-2 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition sm:flex-[1.4] ${isSubmitting ? "pointer-events-none cursor-wait bg-emerald-800/60 opacity-80" : "cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:brightness-95 active:opacity-95"}`}
          >
            {step < totalQ - 1 ? "Keyingi savol" : isSubmitting ? "Hisoblanmoqda…" : "Natijani olish"}
          </button>
        </div>
        {!chosenForCurrent && !isSubmitting ? (
          <p className="mx-auto mt-2 max-w-lg text-center text-[11px] font-medium text-slate-500">Avval javobni tanlang</p>
        ) : null}
      </footer>
    </div>
  );
}

export { TestRunner };
export default TestRunner;
