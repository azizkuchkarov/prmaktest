"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import { submitTestAttempt, saveTestProgress, type SubmitTestResult } from "@/app/testlar/[id]/boshlash/actions";
import { TestCompletionCelebration } from "@/components/test/TestCompletionCelebration";
import { formatPriceSum } from "@/lib/format-uzs";
import { cn } from "@/lib/utils";
import { RenderFractionText } from "@/components/math/RenderFractionText";

export type RunnerQuestion = {
  id: string;
  order: number;
  text: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionAImageUrl?: string | null;
  optionBImageUrl?: string | null;
  optionCImageUrl?: string | null;
  optionDImageUrl?: string | null;
};

export type TestRunnerInitialSession = {
  endsAtMs: number;
  currentStep: number;
  answers: Record<string, string>;
};

type SaveProgressFn = (
  testId: string,
  currentStep: number,
  answers: Record<string, string>,
) => Promise<{ ok: boolean }>;

type SubmitAttemptFn = (
  testId: string,
  answers: Record<string, string>,
  clientSecondsUsed: number,
) => Promise<SubmitTestResult>;

type Props = {
  testId: string;
  title: string;
  durationMinutes: number;
  questions: RunnerQuestion[];
  balanceSum: number;
  priceSum: number;
  isRetake: boolean;
  initialSession: TestRunnerInitialSession;
  saveProgress?: SaveProgressFn;
  submitAttempt?: SubmitAttemptFn;
  resultPrimaryHref?: string;
  resultPrimaryLabel?: string;
  resultSecondaryHref?: string;
  resultSecondaryLabel?: string;
  sessionBadge?: string;
  resultBadge?: string;
};

function formatMmSs(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function TestRunner({
  testId,
  title,
  durationMinutes,
  questions,
  balanceSum,
  priceSum,
  isRetake,
  initialSession,
  saveProgress: saveProgressProp,
  submitAttempt: submitAttemptProp,
  resultPrimaryHref = "/kabinet",
  resultPrimaryLabel = "Kabinetga qaytish",
  resultSecondaryHref,
  resultSecondaryLabel,
  sessionBadge,
  resultBadge,
}: Props) {
  const saveProgressFn = saveProgressProp ?? saveTestProgress;
  const submitAttemptFn = submitAttemptProp ?? submitTestAttempt;
  const secondaryHref = resultSecondaryHref ?? `/testlar/${testId}`;
  const secondaryLabel = resultSecondaryLabel ?? "Test sahifasi";
  const totalSeconds = Math.max(durationMinutes, 1) * 60;
  const safeStepInit = Math.max(
    0,
    Math.min(initialSession.currentStep, Math.max(0, questions.length - 1)),
  );
  /**
   * Deadline faqat client `useEffect`da — SSR va birinchi client render bir xil
   * `totalSeconds` ko‘rsatadi (hydration buzilmasin); iOS’dagi “muskul” UI uchun muhim.
   */
  const deadlineMsRef = useRef(0);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  const [step, setStep] = useState(safeStepInit);
  const [celebrationResult, setCelebrationResult] = useState<SubmitTestResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...initialSession.answers }));
  const [result, setResult] = useState<SubmitTestResult | null>(null);
  const [wrongStep, setWrongStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAtMsRef = useRef(0);
  const finishedRef = useRef(false);
  /** Faqat `pickAnswer` yangilaydi — `= answers` har renderda refni buzmasin */
  const answersRef = useRef<Record<string, string>>({ ...initialSession.answers });
  const stepRef = useRef(step);
  const resultRef = useRef(result);
  const isSubmittingRef = useRef(isSubmitting);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    stepRef.current = step;
    resultRef.current = result;
    isSubmittingRef.current = isSubmitting;
  }, [step, result, isSubmitting]);

  const flushProgress = useCallback(() => {
    if (finishedRef.current || resultRef.current || isSubmittingRef.current) return;
    void saveProgressFn(testId, stepRef.current, answersRef.current);
  }, [testId, saveProgressFn]);

  const totalQ = questions.length;
  const current = questions[step];

  useLayoutEffect(() => {
    const end = initialSession.endsAtMs;
    deadlineMsRef.current = end;
    startedAtMsRef.current = end - totalSeconds * 1000;
    const next = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    queueMicrotask(() => {
      setSecondsLeft(next);
    });
  }, [totalSeconds, initialSession.endsAtMs]);

  const runSubmit = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const used = Math.floor((Date.now() - (startedAtMsRef.current || Date.now())) / 1000);
    setIsSubmitting(true);
    void submitAttemptFn(testId, answersRef.current, used)
      .then((res) => {
        if (res.ok) {
          const ms = reduceMotion === true ? 450 : 3000;
          setCelebrationResult(res);
          window.setTimeout(() => {
            setResult(res);
            setCelebrationResult(null);
          }, ms);
        } else {
          setResult(res);
        }
      })
      .finally(() => setIsSubmitting(false));
  }, [testId, reduceMotion, submitAttemptFn]);

  useEffect(() => {
    if (result || celebrationResult) return;
    const id = window.setInterval(() => {
      const end = deadlineMsRef.current;
      if (!end) return;
      setSecondsLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, [result, celebrationResult, totalSeconds]);

  useEffect(() => {
    if (result || isSubmitting || celebrationResult) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      saveDebounceRef.current = null;
      flushProgress();
    }, 600);
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }
    };
  }, [testId, step, answers, result, isSubmitting, celebrationResult, flushProgress]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        if (saveDebounceRef.current) {
          clearTimeout(saveDebounceRef.current);
          saveDebounceRef.current = null;
        }
        flushProgress();
        return;
      }
      if (document.visibilityState !== "visible") return;
      const end = deadlineMsRef.current;
      if (!end) return;
      setSecondsLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    };
    const onPageHide = () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }
      flushProgress();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushProgress]);

  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }
      flushProgress();
    };
  }, [flushProgress]);

  useEffect(() => {
    if (result || isSubmitting || celebrationResult) return;
    if (secondsLeft > 0) return;
    runSubmit();
  }, [secondsLeft, result, isSubmitting, celebrationResult, runSubmit]);

  const pickAnswerSigRef = useRef<{ t: number; sig: string }>({ t: 0, sig: "" });

  /** pointer + click bir xil javobni ikki marta yozmaslik uchun */
  const pickAnswer = useCallback((questionId: string, letter: string) => {
    const id = String(questionId);
    const sig = `${id}:${letter}`;
    const now = Date.now();
    const prev = pickAnswerSigRef.current;
    if (prev.sig === sig && now - prev.t < 200) {
      return;
    }
    pickAnswerSigRef.current = { t: now, sig };
    setAnswers((prev) => {
      const next = { ...prev, [id]: letter };
      answersRef.current = next;
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    if (result || isSubmitting || celebrationResult) return;
    setStep((s) => {
      const q = questions[s];
      if (!q) return s;
      const qid = String(q.id);
      const chosen = answersRef.current[qid];
      if (!chosen) {
        return s;
      }
      if (s < totalQ - 1) return s + 1;
      queueMicrotask(() => runSubmit());
      return s;
    });
  }, [result, isSubmitting, celebrationResult, questions, totalQ, runSubmit]);

  const goPrev = useCallback(() => {
    if (result || isSubmitting || celebrationResult) return;
    setStep((s) => (s > 0 ? s - 1 : s));
  }, [result, isSubmitting, celebrationResult]);

  if (celebrationResult?.ok && !result) {
    const barSec = reduceMotion === true ? 0.45 : 3;
    return (
      <div
        className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-clip bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/40 px-6 py-12 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <motion.div
          className="relative z-[1] flex max-w-md flex-col items-center text-center"
          initial={reduceMotion === true ? false : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <div className="relative flex h-28 w-28 items-center justify-center">
            {reduceMotion !== true ? (
              <>
                <motion.span
                  className="absolute inset-2 rounded-full bg-amber-400/30"
                  initial={{ scale: 0.85, opacity: 0.6 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: 2, ease: "easeOut" }}
                />
                <motion.span
                  className="absolute inset-2 rounded-full bg-emerald-400/25"
                  initial={{ scale: 0.85, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1.35, repeat: 2, ease: "easeOut", delay: 0.15 }}
                />
              </>
            ) : null}
            <motion.div
              className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white shadow-2xl shadow-amber-500/35 ring-4 ring-white"
              initial={reduceMotion === true ? false : { rotate: -12, scale: 0.85 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 16 }}
            >
              <Trophy className="h-12 w-12" strokeWidth={2} aria-hidden />
            </motion.div>
          </div>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-emerald-900/85">Test yakunlandi</p>
          <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">Natijangiz tayyorlanmoqda</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            Bir necha soniya ichida ball va tafsilotlarni ko&apos;rasiz.
          </p>
          <div className="mt-10 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200/90 shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: barSec, ease: "linear" }}
              aria-hidden
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (result?.ok) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const wrong = result.wrong;
    const w = wrong[wrongStep];

    return (
      <div className="relative min-h-[100dvh] overflow-x-clip bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-slate-900 sm:px-6 sm:py-10">
        <TestCompletionCelebration isRetake={!!result.isRetake} />

        <div className="relative z-10 mx-auto max-w-lg">
          <motion.div
            initial={reduceMotion === true ? false : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 26, delay: reduceMotion === true ? 0 : 0.12 }}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_64px_-28px_rgba(15,23,42,0.28)] ring-1 ring-slate-100/80 sm:rounded-3xl"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.12] via-white to-violet-500/[0.08] px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
              <motion.div
                className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              />
              <div className="relative flex flex-col items-center text-center">
                <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center">
                  {reduceMotion !== true && !result.isRetake ? (
                    <>
                      <motion.span
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-300/50 to-orange-400/40"
                        initial={{ scale: 0.92, opacity: 0.55 }}
                        animate={{ scale: 2.1, opacity: 0 }}
                        transition={{ duration: 1.25, repeat: 2, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <motion.span
                        className="absolute inset-0 rounded-2xl bg-amber-200/35"
                        initial={{ scale: 0.92, opacity: 0.45 }}
                        animate={{ scale: 2.45, opacity: 0 }}
                        transition={{
                          duration: 1.4,
                          repeat: 2,
                          ease: [0.22, 1, 0.36, 1],
                          delay: 0.12,
                        }}
                      />
                    </>
                  ) : null}
                  <motion.div
                    className={cn(
                      "relative z-[1] flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white/90",
                      result.isRetake
                        ? "bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/30"
                        : "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-amber-500/35",
                    )}
                    initial={reduceMotion === true ? false : { scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 17, delay: reduceMotion === true ? 0 : 0.08 }}
                  >
                    {result.isRetake ? (
                      <Sparkles className="h-8 w-8" strokeWidth={2} aria-hidden />
                    ) : (
                      <Trophy className="h-8 w-8" strokeWidth={2} aria-hidden />
                    )}
                  </motion.div>
                </div>
                <motion.p
                  className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-900/80"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {result.isRetake ? "Mashq yakunlandi" : "Tabriklaymiz"}
                </motion.p>
                <p className="mt-1 text-center text-xs font-semibold text-slate-600">
                  {resultBadge ?? (result.isRetake ? "Qayta yechish (mashq)" : "Rasmiy natija")}
                </p>
                <motion.h1
                  className="mt-3 text-balance text-lg font-bold leading-snug text-slate-900 sm:text-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h1>
              </div>
            </div>

            <div className="px-5 pb-5 sm:px-8 sm:pb-8">
              <div className="mt-2 grid grid-cols-3 gap-2 text-center sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
                <div className="min-w-0 rounded-xl bg-slate-50/80 px-1 py-2 sm:rounded-none sm:bg-transparent sm:p-0">
                  <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-4xl">
                    {result.score}/{result.total}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">{"To'g'ri"}</p>
                </div>
                <div className="hidden h-10 w-px bg-slate-200 sm:block" aria-hidden />
                <div className="min-w-0 rounded-xl bg-slate-50/80 px-1 py-2 sm:rounded-none sm:bg-transparent sm:p-0">
                  <motion.p
                    className="text-xl font-bold tabular-nums text-emerald-700 sm:text-4xl"
                    initial={reduceMotion === true ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.25 }}
                  >
                    {pct}%
                  </motion.p>
                  <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">Foiz</p>
                </div>
                <div className="hidden h-10 w-px bg-slate-200 sm:block" aria-hidden />
                <div className="min-w-0 rounded-xl bg-amber-50/80 px-1 py-2 sm:rounded-none sm:bg-transparent sm:p-0">
                  <p className="text-xl font-bold tabular-nums text-amber-600 sm:text-4xl">+{result.rankPoints}</p>
                  <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">
                    {result.isRetake ? "Reyting balli" : "Ball"}
                  </p>
                </div>
              </div>
              {result.isRetake ? (
                <p className="mt-4 rounded-xl bg-sky-50 px-3 py-2 text-center text-xs leading-relaxed text-sky-900 ring-1 ring-sky-200/80">
                  Bu urinish <strong>faqat mashq</strong>: reyting o‘zgarmaydi, balansdan pul yechilmaydi. Rasmiy ball
                  kabinetdagi birinchi topshiruv bo‘yicha qoladi.
                </p>
              ) : null}
              <p className="mt-4 text-center text-sm text-slate-600">
                Sarflangan vaqt: <span className="font-semibold text-slate-900">{formatMmSs(result.secondsUsed)}</span>
              </p>
            </div>
          </motion.div>

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
                    {w.order}. <RenderFractionText text={w.text} />
                  </p>
                  {w.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- uploads under /public
                    <img
                      src={w.imageUrl}
                      alt=""
                      className="max-h-56 w-full rounded-xl border border-amber-200/80 bg-white object-contain shadow-sm"
                    />
                  ) : null}
                  <p className="text-xs text-slate-700">
                    {"Sizning javobingiz: "}
                    <span className="font-bold text-slate-900">{w.chosen ?? "—"}</span>
                    {" · To'g'ri: "}
                    <span className="font-bold text-emerald-700">{w.correct}</span>
                  </p>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Variantlar</p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {w.options.map((o) => {
                        const isCorrect = o.letter === w.correct;
                        const isChosen = o.letter === w.chosen;
                        const wrongPick = isChosen && !isCorrect;
                        return (
                          <li
                            key={o.letter}
                            className={cn(
                              "rounded-xl border bg-white p-2.5 text-left text-sm shadow-sm",
                              isCorrect && "border-emerald-400 ring-1 ring-emerald-200",
                              wrongPick && "border-red-300 ring-1 ring-red-200",
                              !isCorrect && !wrongPick && "border-slate-200",
                            )}
                          >
                            <span className="font-black text-emerald-800">{o.letter}.</span>{" "}
                            {o.text.trim() ? (
                              <span className="font-medium text-slate-800">
                                <RenderFractionText text={o.text} />
                              </span>
                            ) : null}
                            {o.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- uploads under /public
                              <img
                                src={o.imageUrl}
                                alt=""
                                className="mt-2 max-h-40 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
                              />
                            ) : null}
                            {!o.text.trim() && !o.imageUrl ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Yechim</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {w.solution ? <RenderFractionText text={w.solution} /> : "Tushuntirish kiritilmagan."}
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
              href={resultPrimaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:brightness-105 active:brightness-95"
            >
              {resultPrimaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:bg-slate-100"
            >
              {secondaryLabel}
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
    <div className="relative flex min-h-[100svh] w-full min-w-0 flex-col overflow-x-clip bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 text-slate-900 supports-[height:100dvh]:min-h-[100dvh] [-webkit-tap-highlight-color:transparent]">
      <header className="relative z-20 shrink-0 border-b border-slate-200/90 bg-white pt-[max(0px,env(safe-area-inset-top))] shadow-sm">
        <div className="mx-auto max-w-lg px-4 py-3 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                {sessionBadge ?? (isRetake ? "Qayta yechish" : "Aktiv test")}
              </p>
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
              <p className="text-lg font-black tabular-nums leading-none sm:text-xl">{formatMmSs(secondsLeft)}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-600">
            <span className="tabular-nums">
              Balans: {formatPriceSum(balanceSum) || "0 so'm"}
              {priceSum > 0 ? (
                <span className="font-normal text-slate-500">
                  {isRetake ? " · qayta yechish bepul" : ` · test narxi ${formatPriceSum(priceSum)}`}
                </span>
              ) : null}
            </span>
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
      <main className="relative z-10 min-h-0 flex-1 px-4 pb-4 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md shadow-slate-200/50 ring-1 ring-slate-100 sm:rounded-3xl sm:p-7">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-900 ring-1 ring-emerald-200/80">
                {current.order}
              </span>
              <p className="min-w-0 text-[15px] font-semibold leading-relaxed tracking-tight text-slate-900 sm:text-base whitespace-pre-wrap">
                <RenderFractionText text={current.text} />
              </p>
            </div>
            {current.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploads under /public
              <img
                src={current.imageUrl}
                alt=""
                className="mt-4 w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 object-contain shadow-inner"
              />
            ) : null}

            <div
              key={current.id}
              className="mt-5 space-y-3 sm:mt-6"
              role="radiogroup"
              aria-label="Javob variantlari"
            >
              {(
                [
                  ["A", current.optionA, current.optionAImageUrl],
                  ["B", current.optionB, current.optionBImageUrl],
                  ["C", current.optionC, current.optionCImageUrl],
                  ["D", current.optionD, current.optionDImageUrl],
                ] as const
              ).map(([letter, label, optImg]) => {
                const selected = chosenForCurrent === letter;
                const hasText = label.trim().length > 0;
                const hasImg = Boolean(optImg);
                return (
                  <button
                    key={letter}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => pickAnswer(String(current.id), letter)}
                    onPointerUp={(e) => {
                      if (e.button !== 0 && e.pointerType === "mouse") return;
                      pickAnswer(String(current.id), letter);
                    }}
                    className={`flex min-h-[3.5rem] w-full cursor-pointer select-none items-start gap-3 rounded-2xl border-2 px-3 py-3 text-left text-sm font-medium transition-colors duration-150 [-webkit-tap-highlight-color:transparent] sm:min-h-[3.25rem] sm:px-4 ${
                      selected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/60"
                        : "border-slate-200 bg-white text-slate-800 shadow-sm active:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`relative top-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                        selected ? "bg-white/95 ring-2 ring-white/70" : "bg-slate-100 ring-1 ring-slate-200/80"
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selected ? "border-white bg-emerald-600" : "border-slate-400 bg-white"
                        }`}
                      >
                        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                      </span>
                    </span>
                    <span
                      className={`min-w-0 flex-1 leading-snug ${hasText ? "whitespace-pre-wrap" : ""} ${selected ? "text-white" : "text-slate-800"}`}
                    >
                      <span
                        className={`mr-2 inline-block font-black tabular-nums ${selected ? "text-emerald-100" : "text-emerald-700"}`}
                      >
                        {letter}.
                      </span>
                      {hasText ? <RenderFractionText text={label} /> : null}
                      {optImg ? (
                        // eslint-disable-next-line @next/next/no-img-element -- uploads under /public
                        <img
                          src={optImg}
                          alt=""
                          className={`mt-2 w-full max-w-full rounded-xl border object-contain shadow-inner ${selected ? "border-white/40 bg-white/10" : "border-slate-200 bg-slate-50"}`}
                        />
                      ) : null}
                      {!hasText && !hasImg ? (
                        <span className={`text-xs ${selected ? "text-emerald-100" : "text-slate-400"}`}>—</span>
                      ) : null}
                    </span>
                    {selected ? (
                      <span
                        className="relative top-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg font-bold text-white ring-1 ring-white/50"
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
            onClick={goPrev}
            className={`touch-manipulation min-h-14 min-w-[6.5rem] flex-1 rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:min-h-[3.25rem] ${prevLocked ? "pointer-events-none cursor-not-allowed opacity-40" : "cursor-pointer active:bg-slate-100"}`}
          >
            Oldingi
          </button>
          <button
            type="button"
            aria-disabled={isSubmitting}
            onClick={goNext}
            className={`touch-manipulation min-h-14 min-w-[10rem] flex-1 rounded-2xl px-2 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition sm:min-h-[3.25rem] sm:flex-[1.4] ${isSubmitting ? "pointer-events-none cursor-wait bg-emerald-800/60 opacity-80" : "cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:brightness-95 active:opacity-95"}`}
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
