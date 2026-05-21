"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, MapPin, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type KabinetStudyGuideContextValue = {
  openStudyGuide: () => void;
  closeStudyGuide: () => void;
};

const KabinetStudyGuideContext = createContext<KabinetStudyGuideContextValue | null>(null);

export function KabinetStudyGuideProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<KabinetStudyGuideContextValue>(
    () => ({
      openStudyGuide: () => setOpen(true),
      closeStudyGuide: () => setOpen(false),
    }),
    [],
  );
  return (
    <KabinetStudyGuideContext.Provider value={value}>
      {children}
      <KabinetStudyGuideDialog open={open} onOpenChange={setOpen} />
    </KabinetStudyGuideContext.Provider>
  );
}

export function useKabinetStudyGuide(): KabinetStudyGuideContextValue {
  const v = useContext(KabinetStudyGuideContext);
  if (!v) {
    throw new Error("useKabinetStudyGuide must be used inside KabinetStudyGuideProvider");
  }
  return v;
}

/** Sovg‘a uslubidagi salom — SVG + CSS “breathing” */
function VisualWelcome() {
  return (
    <div className="relative mx-auto flex h-[180px] w-full max-w-[280px] items-center justify-center sm:h-[200px]" aria-hidden>
      <motion.div
        className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-blue-400/25 via-violet-400/15 to-teal-400/20 blur-2xl"
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg viewBox="0 0 240 160" className="relative h-full w-full text-slate-800 drop-shadow-lg">
        <defs>
          <linearGradient id="sg-book" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="sg-paper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="72" y="48" width="96" height="72" rx="10" fill="url(#sg-book)" opacity="0.95" />
          <rect x="78" y="54" width="84" height="56" rx="6" fill="url(#sg-paper)" />
          <rect x="88" y="66" width="40" height="4" rx="2" fill="#cbd5e1" />
          <rect x="88" y="76" width="64" height="3" rx="1.5" fill="#e2e8f0" />
          <rect x="88" y="84" width="52" height="3" rx="1.5" fill="#e2e8f0" />
        </motion.g>
        <motion.circle
          cx="196"
          cy="44"
          r="10"
          fill="#fbbf24"
          animate={{ scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M40 52 L48 60 L40 68"
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ pathLength: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </svg>
    </div>
  );
}

/** Bosqichlar: Mock → Bepul → natija */
function VisualPath() {
  const steps = [
    { label: "Mock", color: "from-sky-500 to-cyan-500" },
    { label: "Bepul", color: "from-violet-500 to-fuchsia-500" },
    { label: "Tajriba", color: "from-emerald-500 to-teal-500" },
  ];
  return (
    <div className="mx-auto w-full max-w-sm space-y-4 px-2 py-2" aria-hidden>
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            className={cn(
              "flex min-h-[3.75rem] flex-1 items-center justify-center rounded-2xl bg-gradient-to-br px-2 text-center text-[10px] font-bold uppercase leading-tight text-white shadow-lg sm:min-h-[4.25rem] sm:text-[11px]",
              s.color,
            )}
            animate={{ scale: [1, 1.04, 1], y: [0, -2, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.35 }}
          >
            {s.label}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="h-px flex-1 max-w-[4rem] bg-gradient-to-r from-transparent to-slate-300" />
        <motion.div
          className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-white shadow-md sm:text-[11px]"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Shu tartib tavsiya etiladi
        </motion.div>
        <div className="h-px flex-1 max-w-[4rem] bg-gradient-to-l from-transparent to-slate-300" />
      </div>
    </div>
  );
}

/** Ball yig‘ish diagrammasi — mini ustun grafik */
function VisualPoints() {
  const heights = [32, 48, 64, 80, 100];
  return (
    <div
      className="relative mx-auto flex h-[168px] w-full max-w-xs items-end justify-center gap-2 pb-10 pt-4 sm:h-[184px]"
      aria-hidden
    >
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-[14%] max-w-[2.75rem] rounded-t-lg bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 shadow-md shadow-emerald-500/20"
          initial={{ height: 8 }}
          animate={{ height: h }}
          transition={{ duration: 0.85, delay: i * 0.12, type: "spring", damping: 18 }}
        />
      ))}
      <div className="pointer-events-none absolute bottom-8 left-1/2 flex w-full max-w-[12rem] -translate-x-1/2 justify-center">
        <motion.span
          className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-bold text-emerald-800 shadow-sm sm:text-[11px]"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          Rank ball o‘sadi
        </motion.span>
      </div>
    </div>
  );
}

/** Reyting: Respublika — viloyat/shahar — sinf bloklari */
function VisualRanking() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-3 px-1" aria-hidden>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { t: "Respublika", sub: "Mamlakat TOP", hue: "from-blue-600 to-indigo-600" },
          { t: "Viloyat va shahar", sub: "Mahalliy", hue: "from-violet-600 to-purple-600" },
          { t: "4 / 6-sinf", sub: "Guruh", hue: "from-teal-600 to-emerald-600" },
        ].map((b) => (
          <motion.div
            key={b.t}
            className={cn(
              "rounded-2xl bg-gradient-to-br p-3 text-[10px] font-bold uppercase leading-tight text-white shadow-lg sm:p-3.5 sm:text-[11px]",
              b.hue,
            )}
            initial={{ opacity: 0.85, scale: 0.96 }}
            animate={{ opacity: 1, scale: [0.96, 1, 0.98, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <div className="opacity-95">{b.t}</div>
            <div className="mt-1 font-medium normal-case opacity-85">{b.sub}</div>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2.5">
        <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
        <p className="text-center text-[11px] font-medium leading-snug text-slate-600 sm:text-xs">
          Ball yig‘ganingizdan keyin <strong className="text-slate-800">kabinetidagi Leaderboard</strong> va{" "}
          <strong className="text-slate-800">Reyting</strong> kartangiz yangilanadi.
        </p>
      </div>
    </div>
  );
}

const STEPS = [
  {
    id: "welcome",
    title: "Platformaga xush kelibsiz",
    body: (
      <>
        Kabinetda siz tayyorgarlikni bosqichma-bosqich kuzatasiz: testlar orqali bilim va <strong>mashq ballari</strong>{" "}
        (rank ball), so‘ngra esa <strong>o‘zingiz uchun</strong> shaxsiylashtirilgan reyting.
      </>
    ),
    visual: <VisualWelcome />,
  },
  {
    id: "path",
    title: "Birinchi qadam — mock va bepul testlar",
    body: (
      <>
        Avvalo <strong>Mock testlar</strong>ni yeching — bu rasmiy formatga yaqin muhit. Keyin boshqa bo‘limlarda joylashgan{" "}
        <strong>bepul</strong> testlarni qamrab oling. Shunda siz sinovdan o‘tib, zaif tomonlaringizni va sur’atni
        o‘lchaysiz.
      </>
    ),
    visual: <VisualPath />,
  },
  {
    id: "points",
    title: "Ball yig‘ish",
    body: (
      <>
        Har bir topshiruvda to‘g‘ri javoblar va qoidalar bo‘yicha hisoblangan <strong>rank ball</strong> yig‘iladi.
        Ballar jamlanib, sizning umumiy natijangiz shakllanadi — bu reyting jadvallarida taqqoslash uchun asos bo‘ladi.
      </>
    ),
    visual: (
      <div className="relative">
        <VisualPoints />
      </div>
    ),
  },
  {
    id: "ranking",
    title: "Reyting qanday aniqlanadi?",
    body: (
      <>
        Ball yig‘ganingizdan so‘ng siz o‘z o‘rningizni ko‘rasiz: <strong>butun Respublika</strong> bo‘yicha, shuningdek{" "}
        <strong>ro‘yxatdan o‘tgan viloyatingiz yoki shahringiz</strong> (masalan, Toshkent shahri alohida) bo‘yicha.
        Qo‘shimcha ravishda <strong>4-sinf</strong> va <strong>6-sinf (5–9-sinflar guruhi)</strong> leaderboardlari
        orqali sinf bo‘yicha ham o‘rningiz ko‘rsatiladi.
      </>
    ),
    visual: <VisualRanking />,
  },
  {
    id: "cta",
    title: "Tayyor — katalogga o‘ting",
    body: (
      <>
        Endi <strong>Testlar katalogi</strong>dan boshlang: bo‘limni tanlang, test haqida o‘qing va yechishni
        boshlang. Agar savol bo‘lsa, menyu orqali <strong>24/7 yordam</strong>ga murojaat qilishingiz mumkin.
      </>
    ),
    visual: (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-4 py-2" aria-hidden>
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-xl shadow-blue-500/30">
          <BookOpen className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Katalog
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-blue-500" /> Reyting
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
            <Trophy className="h-3.5 w-3.5 text-amber-600" /> Natija
          </span>
        </div>
      </div>
    ),
  },
] as const;

function KabinetStudyGuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const len = STEPS.length;
  const isLast = step === len - 1;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="kabinet-study-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Kabinet bo‘yicha yo‘riqnoma, ${step + 1}-qadam, jami ${len}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="fixed inset-0 z-[10075] flex items-end justify-center bg-black/45 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm [touch-action:manipulation] sm:items-center sm:p-6"
        >
          <motion.div
            layout
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[min(92dvh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-[1.25rem] border border-white/70 bg-gradient-to-b from-white via-white to-slate-50 shadow-[0_32px_100px_-24px_rgba(15,23,42,0.45)] ring-2 ring-white/90 max-sm:max-h-[min(88svh,720px)] sm:rounded-[1.5rem]"
          >
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3 border-b border-slate-100/90 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700/85">Tanishuv</p>
            <div className="mt-2 flex gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === step ? "w-6 bg-blue-600" : "w-2 bg-slate-200",
                  )}
                  aria-hidden
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition [touch-action:manipulation] hover:bg-slate-50"
          >
            O‘tkazib yuborish
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={STEPS[step].id}
              id="kabinet-study-guide-desc"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                {STEPS[step].visual}
              </div>
              <h2 className="text-balance text-lg font-bold leading-snug tracking-tight text-slate-900 sm:text-xl">
                {STEPS[step].title}
              </h2>
              <p className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-[15px]">{STEPS[step].body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative border-t border-slate-100/90 bg-white/95 px-4 py-4 sm:px-6">
          {!isLast ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex min-h-11 min-w-[3rem] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition [touch-action:manipulation] hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
                <span className="sr-only">Oldingi</span>
              </button>
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(len - 1, s + 1))}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition [touch-action:manipulation] hover:brightness-105 active:brightness-95"
              >
                Davom etish
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/testlar"
                onClick={handleClose}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] via-[#4f46e5] to-[#7C3AED] px-4 text-base font-bold text-white shadow-xl shadow-blue-500/25 transition [touch-action:manipulation] hover:brightness-105 active:brightness-95"
              >
                Testlar katalogiga o‘tish
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="text-center text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Kabinetda qolish
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
