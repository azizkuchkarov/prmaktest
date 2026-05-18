"use client";

import Link from "next/link";
import { useId, useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Newspaper,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AccordionDetails } from "@/components/test-catalog/AccordionDetails";
import type { LeaderboardRow, StudentRankSummary, ViloyatTotalRow } from "@/lib/student-ranking";
import { formatPhoneDisplay } from "@/lib/phone";
import type { RadarSubjectPoint, ReadinessStats, WeekProgressPoint } from "@/lib/kabinet-analytics";
import { KabinetRankingCharts } from "@/components/kabinet/KabinetRankingCharts";
import { KabinetBalanceClick } from "@/components/kabinet/KabinetBalanceClick";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatPriceSum, formatUzInteger } from "@/lib/format-uzs";
import { isValidStudentGrade } from "@/lib/student-grade";
import { KabinetRoadmap } from "@/components/kabinet/KabinetRoadmap";
import { TelegramDeepLink } from "@/components/auth/TelegramDeepLink";
import {
  CATALOG_MENU_MAX,
  CATALOG_PANEL_PREMIUM,
  CATALOG_SECTION_META,
  TEST_CATALOG_ORDER,
  normalizeTestCatalogCategory,
  pickLatestTestsForCatalogMenu,
} from "@/lib/test-catalog";
import type { TestCatalogCategory } from "@prisma/client";

export type KabinetBentoNews = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

export type KabinetBentoTest = {
  id: string;
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  priceSum: number;
  questionsCount: number;
  stage: string;
  updatedAt: string;
  createdAt: string;
  completed: boolean;
  catalogCategory: string;
};

export type KabinetBentoStudent = {
  id: string;
  phone: string;
  viloyat: string;
  firstName: string;
  lastName: string;
  parentPhone: string;
  balanceSum: number;
  gradeLevel: number;
  /** Telegram bildirishnomalari — `null` bo‘lsa ulanmagan */
  telegramLinked: boolean;
  telegramUsername: string | null;
};

type Props = {
  student: KabinetBentoStudent;
  displayName: string;
  rank: StudentRankSummary;
  republicRows: LeaderboardRow[];
  viloyatRows: LeaderboardRow[];
  gradeRepublicRows: LeaderboardRow[];
  gradeViloyatRows: LeaderboardRow[];
  republicViloyatTotals: ViloyatTotalRow[];
  news: KabinetBentoNews[];
  tests: KabinetBentoTest[];
  weekly: WeekProgressPoint[];
  radar: RadarSubjectPoint[];
  readiness: ReadinessStats;
};

const cardShell =
  "min-w-0 rounded-3xl border border-white/60 bg-white shadow-xl shadow-slate-200/35 ring-1 ring-slate-200/50";

/** opacity:0 initial SSR/mobilda kontent yo‘qolishi mumkin — faqat Y siljishi */
const fadeUp = {
  initial: { y: 12 },
  whileInView: { y: 0 },
  viewport: { once: true, amount: 0.06, margin: "0px 0px 100px 0px" },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

function subscribeMqLg(cb: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMqLgSnapshot() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function subscribeMqSm(cb: () => void) {
  const mq = window.matchMedia("(max-width: 639px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMqSmSnapshot() {
  return window.matchMedia("(max-width: 639px)").matches;
}

const premiumChartCard =
  "relative min-w-0 overflow-hidden rounded-[1.35rem] border border-slate-200/55 bg-gradient-to-br from-white via-white to-slate-50/[0.85] shadow-[0_22px_56px_-28px_rgba(15,23,42,0.22)] ring-1 ring-white/90";

/** lg+: chartlar; mobil va SSRda null (0×0 Recharts ogohlantirishlari yo‘q) */
function KabinetRankingChartsDesktop(props: {
  republicByViloyat: ViloyatTotalRow[];
  userViloyat: string;
  viloyatTop: LeaderboardRow[];
  currentUserId: string;
}) {
  const lg = useSyncExternalStore(subscribeMqLg, getMqLgSnapshot, () => false);
  if (!lg) return null;
  return <KabinetRankingCharts {...props} />;
}

function ReadinessRing({ pct }: { pct: number }) {
  const uid = useId().replace(/:/g, "");
  const r = 52;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;
  const gradId = `grad-${uid}`;

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} className="fill-none stroke-slate-100" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="fill-none transition-all duration-700"
          stroke={`url(#${gradId})`}
          strokeWidth="10"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative z-10 text-center">
        <p className="text-3xl font-bold tabular-nums text-slate-900">{clamped}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">tayyorlik</p>
      </div>
    </div>
  );
}

function BoardTableBento({
  rows,
  currentUserId,
  title,
  subtitle,
}: {
  rows: LeaderboardRow[];
  currentUserId: string;
  title: string;
  subtitle: string;
}) {
  const medal = (r: number) => {
    if (r === 1) return "🥇";
    if (r === 2) return "🥈";
    if (r === 3) return "🥉";
    return null;
  };

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden", cardShell)}>
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-[11px] text-slate-600">{subtitle}</p>
      </div>
      <ul className="max-h-[min(50vh,22rem)] flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain">
        {rows.length === 0 ? (
          <li className="px-4 py-10 text-center text-xs text-slate-500">{"Hozircha ma'lumot yo‘q."}</li>
        ) : (
          rows.map((r) => (
            <li
              key={`${r.userId}-${r.rank}`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm",
                r.userId === currentUserId ? "bg-[#2563EB]/[0.06] ring-1 ring-inset ring-[#2563EB]/15" : "bg-white"
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xs font-black tabular-nums text-slate-700">
                {medal(r.rank) ?? r.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{r.name}</p>
                <p className="truncate text-[10px] text-slate-500">{r.viloyat}</p>
              </div>
              <span className="shrink-0 font-mono text-xs font-bold text-[#2563EB]">{r.points}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function shortViloyatLabel(name: string) {
  return name.replace(/\s+viloyati\s*$/i, "").replace(/^Toshkent shahri$/i, "Toshkent sh.");
}

/** Mobil uchun bitta gorizontal bar — viloyatlar / TOP taqqoslash */
function CompactRankingBar({
  republicByViloyat,
  userViloyat,
}: {
  republicByViloyat: ViloyatTotalRow[];
  userViloyat: string;
}) {
  const repData = useMemo(
    () =>
      republicByViloyat.slice(0, 10).map((r) => ({
        name: shortViloyatLabel(r.viloyat),
        ball: r.totalPoints,
        sizniki: r.viloyat === userViloyat,
      })),
    [republicByViloyat, userViloyat]
  );

  const barBlue = "#93c5fd";
  const barYou = "#2563EB";
  const barH = 240;

  if (repData.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Hozircha viloyatlar bo‘yicha ma’lumot yo‘q.</p>;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="w-full min-w-0" style={{ height: barH }}>
        <ResponsiveContainer width="100%" height={barH} minWidth={0} debounce={50}>
          <BarChart data={repData} layout="vertical" margin={{ left: 2, right: 4, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-slate-100" vertical={false} />
            <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={48}
              tick={{ fontSize: 8, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-xs shadow-lg">
                    <p className="font-bold text-slate-900">{label}</p>
                    <p className="mt-0.5 font-semibold text-[#2563EB]">
                      {formatUzInteger(Number(payload[0]?.value))} ball
                    </p>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(15,23,42,0.04)" }}
            />
            <Bar dataKey="ball" radius={[0, 6, 6, 0]} maxBarSize={16}>
              {repData.map((entry, i) => (
                <Cell key={i} fill={entry.sizniki ? barYou : barBlue} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function KabinetCatalogTestRow({ test: t, category }: { test: KabinetBentoTest; category: TestCatalogCategory }) {
  const accent = CATALOG_PANEL_PREMIUM[category];
  const done = t.completed;
  return (
    <li
      className={cn(
        "group/card relative box-border w-full min-w-0 max-w-full overflow-hidden rounded-2xl py-3.5 pl-3 pr-3 transition duration-300 sm:pl-4 sm:pr-4",
        accent.cardBar,
        done
          ? "border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/45 to-teal-50/30 shadow-[0_22px_48px_-26px_rgba(16,185,129,0.45)] ring-1 ring-emerald-300/35"
          : cn(
              "border border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-sm",
              "hover:border-slate-300/90 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.18)]",
            ),
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover/card:opacity-[0.14]",
          done ? "bg-emerald-400/25 opacity-[0.12]" : cn("opacity-[0.07]", accent.orb),
        )}
      />
      {done ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1] flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "break-words text-[13px] font-semibold leading-snug tracking-tight sm:text-sm",
                done ? "text-emerald-950" : "text-slate-900",
              )}
            >
              {t.title}
            </h3>
            {done ? (
              <Badge
                variant="outline"
                className="h-5 shrink-0 rounded-full border-emerald-300/80 bg-emerald-100/80 px-2 py-0 text-[10px] font-bold uppercase tracking-wide text-emerald-900 shadow-sm"
              >
                Yechilgan
              </Badge>
            ) : null}
          </div>
          {t.subject ? (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{t.subject}</p>
          ) : null}
        </div>
        {done ? (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-white/90"
            title="Rasmiy topshiruv qilingan"
          >
            <Check className="h-5 w-5" aria-hidden strokeWidth={2.75} />
            <span className="sr-only">Tugallangan</span>
          </span>
        ) : null}
      </div>
      <div className={cn("relative z-[1] mt-3 flex flex-wrap gap-2", done && "opacity-90")}>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium",
            done
              ? "border-emerald-200/60 bg-white/70 text-emerald-900"
              : "border-slate-200/80 bg-slate-50 text-slate-600",
          )}
        >
          <Clock className={cn("h-3.5 w-3.5", done ? "text-emerald-600" : "text-slate-400")} />
          {t.durationMinutes} daq
        </span>
        <span className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-semibold", accent.chipBorder)}>
          {t.questionsCount} savol
        </span>
        {t.priceSum > 0 ? (
          <span className="inline-flex items-center gap-0.5 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
            <Banknote className="h-3.5 w-3.5" aria-hidden />
            {formatPriceSum(t.priceSum)}
          </span>
        ) : null}
      </div>
      <div className="relative z-[1] mt-4 flex flex-col gap-2 border-t border-slate-100/90 pt-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:justify-end">
        {t.questionsCount > 0 ? (
          <Link
            href={`/testlar/${t.id}`}
            className={cn(
              "inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold shadow-sm transition min-[400px]:w-auto",
              done
                ? "border border-emerald-200/90 bg-white/90 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/80"
                : "border border-slate-200/90 bg-white text-slate-800 hover:border-blue-200 hover:bg-slate-50 hover:text-blue-800",
            )}
          >
            Test haqida
            <ArrowRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
          </Link>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400">{"Savollar yo'q"}</span>
        )}
      </div>
    </li>
  );
}

export function KabinetBentoContent({
  student,
  displayName,
  rank,
  republicRows,
  viloyatRows,
  gradeRepublicRows,
  gradeViloyatRows,
  republicViloyatTotals,
  news,
  tests,
  weekly,
  radar,
  readiness,
}: Props) {
  const chartUid = useId().replace(/:/g, "");
  const chartNarrow = useSyncExternalStore(subscribeMqSm, getMqSmSnapshot, () => true);
  const firstName = displayName.split(" ").filter(Boolean)[0] || "do‘st";
  const gradeOk = isValidStudentGrade(student.gradeLevel);
  const nextTest =
    tests.find((t) => t.questionsCount > 0 && !t.completed) ??
    tests.find((t) => t.questionsCount > 0) ??
    tests[0];
  const radarHasData = radar.some((d) => d.fullMark > 0);

  const radarChartH = chartNarrow ? 252 : 312;
  const donutChartH = chartNarrow ? 232 : 272;
  const weeklyChartH = chartNarrow ? 240 : 296;
  const radarOuterPct = chartNarrow ? "56%" : "68%";
  const axisTick = chartNarrow ? 10 : 12;
  const radarTick = chartNarrow ? 9 : 11;

  const donutData = useMemo(() => {
    const p = Math.max(0, Math.min(100, readiness.pct));
    return [
      { name: "Tayyor", value: p },
      { name: "Qolgan", value: Math.max(0, 100 - p) },
    ];
  }, [readiness.pct]);

  const { testsByCategory, catalogTotals } = useMemo(() => {
    const buckets: Record<string, KabinetBentoTest[]> = {
      MOCK: [],
      MATHEMATICS: [],
      CRITICAL_LOGIC: [],
      ENGLISH: [],
    };
    for (const t of tests) {
      const c = normalizeTestCatalogCategory(t.catalogCategory);
      buckets[c].push(t);
    }
    const totals: Record<string, number> = {};
    for (const cat of TEST_CATALOG_ORDER) {
      const full = buckets[cat] ?? [];
      totals[cat] = full.length;
      buckets[cat] = pickLatestTestsForCatalogMenu(full, CATALOG_MENU_MAX);
    }
    return { testsByCategory: buckets, catalogTotals: totals };
  }, [tests]);

  const defaultOpenCatalogCategory = useMemo(() => {
    for (const c of TEST_CATALOG_ORDER) {
      if ((catalogTotals[c] ?? 0) > 0) return c;
    }
    return TEST_CATALOG_ORDER[0] ?? "MOCK";
  }, [catalogTotals]);

  return (
    <div className="relative box-border mx-auto w-full min-w-0 max-w-6xl space-y-4 overflow-x-clip py-5 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:space-y-5 sm:px-6 sm:py-7 lg:space-y-6 lg:py-9">
      <div
        className="pointer-events-none fixed left-1/2 top-0 z-0 h-[min(42vh,320px)] w-[min(100dvw,calc(100vw-2px),520px)] max-w-[100dvw] -translate-x-1/2 opacity-90"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(124,58,237,0.18),transparent_58%)] blur-2xl" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_62%_55%,rgba(37,99,235,0.2),transparent_55%)] blur-2xl" />
      </div>

      <motion.section
        id="bosh"
        {...fadeUp}
        className={cn("relative scroll-mt-20 overflow-x-clip overflow-y-visible lg:scroll-mt-6", cardShell)}
      >
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.28),transparent_60%)] blur-3xl" />
        <Card className="border-0 bg-transparent shadow-none ring-0">
          <CardHeader className="relative z-10 pb-2">
            <Badge className="w-fit rounded-full border-0 bg-[#2563EB]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB] hover:bg-[#2563EB]/15">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-[#F59E0B]" />
              Shaxsiy panel
            </Badge>
            <CardTitle className="mt-3 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Salom, {firstName} 👋
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Bugungi maqsad: barqaror progress va kamida bitta sifatli test.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <MapPin className="mr-1 h-3.5 w-3.5 text-[#2563EB]" />
                {student.viloyat}
              </Badge>
              {gradeOk ? (
                <Badge
                  variant="outline"
                  className="rounded-xl border-violet-200 bg-violet-50 font-bold text-violet-900"
                >
                  {student.gradeLevel}-sinf
                </Badge>
              ) : null}
              <Badge className="rounded-xl border-0 bg-amber-100/90 font-bold text-amber-950">
                <Banknote className="mr-1 h-3.5 w-3.5" aria-hidden />
                Balans:{" "}
                <span className="tabular-nums">{formatUzInteger(student.balanceSum)} so&apos;m</span>
              </Badge>
              <Badge className="rounded-xl border-0 bg-[#10B981]/15 font-bold text-[#059669]">Rank ball: {rank.totalPoints}</Badge>
            </div>
            {nextTest && nextTest.questionsCount > 0 ? (
              <Link
                href={`/testlar/${nextTest.id}`}
                className="hidden w-full min-[480px]:inline-flex sm:w-auto sm:shrink-0 min-[480px]:max-w-xs lg:inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/20 transition hover:brightness-105 active:brightness-95"
              >
                Test haqida
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <Link
                href="/testlar"
                className="hidden w-full sm:inline-flex sm:w-auto sm:shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
              >
                Testlar katalogi
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
          <div className="relative z-10 border-t border-slate-100/90 px-6 pb-6 pt-4 sm:px-8">
            <KabinetBalanceClick />
          </div>
        </Card>
      </motion.section>

      <motion.section {...fadeUp} id="yangiliklar" className="relative scroll-mt-20 lg:scroll-mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
              <Newspaper className="h-7 w-7 text-[#2563EB]" />
              Yangiliklar
            </h2>
            <p className="mt-1 text-sm text-slate-600">Platforma yangilanishlari.</p>
          </div>
          <Link href="/yangiliklar" className="shrink-0 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
            Barchasi →
          </Link>
        </div>
        <ul className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.length === 0 ? (
            <li className={cn("col-span-full py-14 text-center text-sm text-slate-500", cardShell)}>
              {"Hozircha yangiliklar yo'q."}
            </li>
          ) : (
            news.map((n) => (
              <li key={n.id} className="min-w-0">
                <Link
                  href={`/yangiliklar/${n.id}`}
                  className={cn(
                    "group flex h-full flex-col p-5 transition hover:border-[#2563EB]/25 hover:shadow-lg",
                    cardShell
                  )}
                >
                  <h3 className="font-semibold leading-snug text-slate-900 group-hover:text-[#2563EB]">{n.title}</h3>
                  {n.excerpt ? (
                    <p className="mt-2 line-clamp-2 flex-1 text-xs text-slate-600">{n.excerpt}</p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                    O‘qish <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </motion.section>

      <div className="relative grid auto-rows-min gap-4 min-w-0 lg:grid-cols-12 lg:gap-5">
        <motion.section {...fadeUp} id="reyting" className="scroll-mt-24 lg:col-span-4 lg:scroll-mt-6">
          <div className={cn("p-5", cardShell)}>
            <div className="flex items-center gap-2 text-slate-600">
              <Trophy className="h-5 w-5 text-[#F59E0B]" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Reyting</span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {gradeOk && rank.gradeRepublicRank != null ? (
                <>
                  {rank.gradeRepublicRank}
                  <span className="ml-1 text-lg font-semibold text-slate-400">
                    ({student.gradeLevel}-sinf, resp.)
                  </span>
                </>
              ) : rank.republicRank != null ? (
                <>
                  {rank.republicRank}
                  <span className="ml-1 text-lg font-semibold text-slate-400">Respublika</span>
                </>
              ) : (
                <span className="text-xl text-slate-400">—</span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {gradeOk
                ? "Sinfingizdagi o‘quvchilar orasida — Respublika bo‘yicha."
                : "Butun mamlakat bo‘yicha o‘rin (sinf tanlanmagan)."}
            </p>
            {gradeOk && rank.republicRank != null ? (
              <p className="mt-1 text-[11px] text-slate-500">
                Umumiy Respublika: <span className="font-semibold text-slate-700">{rank.republicRank}</span>
                -o‘rin
              </p>
            ) : null}
            <div className="mt-4 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {gradeOk ? "Viloyat (shu sinf)" : "Viloyat"}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {gradeOk && rank.gradeViloyatRank != null ? (
                  <>
                    {rank.gradeViloyatRank}
                    <span className="ml-1 text-base font-semibold text-slate-400">-o‘rin</span>
                  </>
                ) : rank.viloyatRank != null ? (
                  <>
                    {rank.viloyatRank}
                    <span className="ml-1 text-base font-semibold text-slate-400">-o‘rin</span>
                  </>
                ) : (
                  <span className="text-lg text-slate-400">—</span>
                )}
              </p>
              <p className="text-xs text-slate-600">{student.viloyat}</p>
              {gradeOk && rank.viloyatRank != null ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  Umumiy viloyat: <span className="font-semibold text-slate-700">{rank.viloyatRank}</span>
                  -o‘rin
                </p>
              ) : null}
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp} id="tayyorgarlik" className="scroll-mt-24 lg:col-span-4 lg:scroll-mt-6">
          <div className={cn("flex flex-col items-center p-5 text-center", cardShell)}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Tayyorgarlik</p>
            <p className="mx-auto mt-2 max-w-[16rem] text-sm font-semibold leading-snug text-slate-800">
              Sen {readiness.pct}% tayyorsan
            </p>
            <ReadinessRing pct={readiness.pct} />
            <p className="mt-2 text-xs text-slate-500">
              O‘rtacha natija ~{readiness.avgScorePct}% · {readiness.testsAttempted}/{readiness.testsPublished} test
            </p>
          </div>
        </motion.section>

        <motion.section {...fadeUp} id="keyingi-test" className="scroll-mt-24 lg:col-span-4 lg:scroll-mt-6">
          <div className={cn("flex h-full flex-col p-5", cardShell)}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Keyingi test</p>
            {nextTest ? (
              <>
                <h3 className="mt-2 text-lg font-bold leading-snug text-slate-900">{nextTest.title}</h3>
                {nextTest.subject ? (
                  <Badge className="mt-2 w-fit rounded-lg bg-[#7C3AED]/12 font-semibold text-[#6d28d9] hover:bg-[#7C3AED]/18">
                    {nextTest.subject}
                  </Badge>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">
                    <Clock className="h-3 w-3" />
                    {nextTest.durationMinutes} daq
                  </span>
                  <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 font-semibold text-[#1d4ed8]">
                    {nextTest.questionsCount} savol
                  </span>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {nextTest.questionsCount > 0 ? (
                    <Link
                      href={`/testlar/${nextTest.id}`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1d4ed8] sm:w-auto"
                    >
                      Test haqida
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">{"Hozircha testlar yo‘q."}</p>
            )}
          </div>
        </motion.section>

        <motion.section
          {...fadeUp}
          id="diagrammalar"
          className="scroll-mt-24 space-y-5 sm:space-y-6 lg:col-span-12 lg:scroll-mt-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB]/15 to-violet-500/15 text-[#2563EB] shadow-inner ring-1 ring-slate-200/50">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
                  Analitika
                </p>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-[1.65rem]">
                Diagrammalar
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
                Fanlar bo‘yicha profil, tayyorgarlik ulushi va haftalik dinamika — barchasi mobil uchun moslashtirilgan.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-12 lg:gap-6">
            {/* Radar */}
            <div className={cn("p-0 lg:col-span-7", premiumChartCard)}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/[0.09] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/[0.07] blur-3xl" />
              <div className="relative border-b border-slate-100/90 px-4 py-3.5 sm:px-6 sm:py-4">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">Fanlar bo‘yicha</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  Radar — katalog bo‘limlari bo‘yicha o‘rtacha foiz: Mock Test, Matematikadan, tanqidiy-mantiqiy, Ingliz tili.
                </p>
              </div>
              <div className="relative px-2 pb-4 pt-1 sm:px-4 sm:pb-5 sm:pt-2">
                {!radarHasData ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 px-4 py-14 text-center sm:min-h-[260px]">
                    <p className="max-w-xs text-sm font-medium text-slate-600">
                      Hozircha fan bo‘yicha ma’lumot yo‘q.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Test topshirgach diagramma paydo bo‘ladi.</p>
                  </div>
                ) : (
                  <div className="box-border w-full min-w-0" style={{ height: radarChartH }}>
                    <ResponsiveContainer width="100%" height={radarChartH} minWidth={0} debounce={50}>
                      <RadarChart cx="50%" cy="50%" outerRadius={radarOuterPct} data={radar}>
                        <defs>
                          <linearGradient id={`radar-grad-${chartUid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="55%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#7C3AED" />
                          </linearGradient>
                        </defs>
                        <PolarGrid stroke="#cbd5e1" strokeOpacity={0.45} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#475569", fontSize: radarTick, fontWeight: 600 }}
                          tickLine={false}
                        />
                        <Radar
                          name="Foiz"
                          dataKey="fullMark"
                          stroke={`url(#radar-grad-${chartUid})`}
                          strokeWidth={2.25}
                          fill={`url(#radar-grad-${chartUid})`}
                          fillOpacity={0.32}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "4 4", stroke: "#94a3b8", strokeOpacity: 0.7 }}
                          content={({ payload }) =>
                            payload?.[0] ? (
                              <div className="rounded-2xl border border-slate-200/70 bg-white/95 px-3 py-2 text-xs shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)] backdrop-blur-md">
                                <p className="font-bold text-slate-900">{String(payload[0].payload?.subject)}</p>
                                <p className="mt-1 tabular-nums font-semibold text-[#2563EB]">{payload[0].value}%</p>
                              </div>
                            ) : null
                          }
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Donut */}
            <div className={cn("p-0 lg:col-span-5", premiumChartCard)}>
              <div className="pointer-events-none absolute -left-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-emerald-400/[0.06] blur-3xl" />
              <div className="relative border-b border-slate-100/90 px-4 py-3.5 sm:px-6 sm:py-4">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">Tayyorgarlik ulushi</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  Donut — umumiy tayyorgarlik; markazda foiz.
                </p>
              </div>
              <div className="relative flex min-h-0 flex-col items-center px-2 pb-5 pt-2 sm:px-4 sm:pb-6">
                <div
                  className="relative mx-auto w-full min-w-0 max-w-[min(100%,20rem)]"
                  style={{ height: donutChartH }}
                >
                  <ResponsiveContainer width="100%" height={donutChartH} minWidth={0} debounce={50}>
                    <PieChart>
                      <defs>
                        <linearGradient id={`donut-ready-${chartUid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                        <linearGradient id={`donut-rest-${chartUid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#e2e8f0" />
                          <stop offset="100%" stopColor="#f1f5f9" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={chartNarrow ? "58%" : "56%"}
                        outerRadius={chartNarrow ? "88%" : "86%"}
                        paddingAngle={2.5}
                        cornerRadius={8}
                        stroke="rgba(255,255,255,0.85)"
                        strokeWidth={2}
                      >
                        <Cell fill={`url(#donut-ready-${chartUid})`} />
                        <Cell fill={`url(#donut-rest-${chartUid})`} />
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const name = String(payload[0].name);
                          const v = Math.round(Number(payload[0].value));
                          return (
                            <div className="rounded-2xl border border-slate-200/70 bg-white/95 px-3 py-2 text-xs shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)] backdrop-blur-md">
                              <p className="font-bold text-slate-900">{name}</p>
                              <p className="mt-1 tabular-nums font-semibold text-violet-700">{v}%</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center pb-1"
                    aria-hidden
                  >
                    <div className="text-center">
                      <p className="bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-2xl font-bold tabular-nums text-transparent sm:text-3xl">
                        {Math.round(readiness.pct)}%
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        tayyorlik
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-600 sm:mt-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600" />
                    Tayyor
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    Qolgan
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Area */}
            <div className={cn("p-0 lg:col-span-12", premiumChartCard)}>
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-400/[0.07] blur-3xl" />
              <div className="relative border-b border-slate-100/90 px-4 py-3.5 sm:px-6 sm:py-4">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">Haftalik progress</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  So‘nggi haftalar — o‘rtacha test foizi (gradient ostida).
                </p>
              </div>
              <div className="relative px-1 pb-4 pt-1 sm:px-3 sm:pb-5 sm:pt-2">
                <div className="box-border w-full min-w-0" style={{ height: weeklyChartH }}>
                  <ResponsiveContainer width="100%" height={weeklyChartH} minWidth={0} debounce={50}>
                    <AreaChart
                      data={weekly}
                      margin={{
                        left: chartNarrow ? -18 : -8,
                        right: chartNarrow ? 4 : 8,
                        top: 16,
                        bottom: chartNarrow ? 4 : 8,
                      }}
                    >
                      <defs>
                        <linearGradient id={`weekly-fill-${chartUid}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                          <stop offset="55%" stopColor="#34d399" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id={`weekly-stroke-${chartUid}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e2e8f0" strokeOpacity={0.9} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: axisTick, fill: "#64748b", fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        domain={[0, 100]}
                        width={chartNarrow ? 26 : 32}
                        tick={{ fontSize: axisTick - 1, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        content={({ active, label, payload }) => {
                          if (!active || !payload?.length) return null;
                          const v = payload[0]?.value;
                          return (
                            <div className="rounded-2xl border border-slate-200/70 bg-white/95 px-3 py-2 text-xs shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)] backdrop-blur-md">
                              <p className="font-bold text-slate-900">Hafta: {label}</p>
                              <p className="mt-1 tabular-nums font-semibold text-emerald-700">{v}% o‘rtacha</p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={`url(#weekly-stroke-${chartUid})`}
                        strokeWidth={2.75}
                        fill={`url(#weekly-fill-${chartUid})`}
                        activeDot={{
                          r: chartNarrow ? 5 : 6,
                          fill: "#059669",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        dot={{
                          r: chartNarrow ? 3 : 4,
                          fill: "#10b981",
                          strokeWidth: 0,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={cn("min-w-0 overflow-x-clip lg:col-span-12", cardShell)}>
              <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                <h3 className="text-sm font-bold text-slate-900">Viloyat va Respublika</h3>
                <p className="mt-1 text-[11px] text-slate-600">Bar chart — yig‘ma ballar bilan taqqoslash.</p>
              </div>
              <div className="p-3 sm:p-4 lg:hidden">
                <CompactRankingBar republicByViloyat={republicViloyatTotals} userViloyat={student.viloyat} />
              </div>
              <div className="hidden p-3 sm:p-4 lg:block">
                <KabinetRankingChartsDesktop
                  republicByViloyat={republicViloyatTotals}
                  userViloyat={student.viloyat}
                  viloyatTop={viloyatRows}
                  currentUserId={student.id}
                />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeUp}
          id="testlar"
          className="min-w-0 scroll-mt-24 lg:col-span-12 lg:scroll-mt-6"
        >
          <div className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-white/90 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/40 p-px shadow-[0_28px_90px_-32px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/25">
            <div className="relative min-w-0 overflow-x-clip overflow-y-visible rounded-[1.7rem] bg-gradient-to-b from-white/95 to-slate-50/40 px-3 py-5 backdrop-blur-xl sm:px-7 sm:py-8">
              <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/[0.12] via-violet-500/[0.08] to-transparent blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-400/[0.1] to-transparent blur-3xl" />

              <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-5">
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-xl shadow-blue-500/30 ring-4 ring-white/80 sm:h-14 sm:w-14">
                    <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
                      Premium katalog
                    </p>
                    <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Testlar katalogi
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                      Bo&apos;lim sarlavhasini bosing — ro&apos;yxat ochiladi yoki yopiladi. Sarlavhada shu yo&apos;nalishdagi{" "}
                      <span className="font-medium text-slate-800">testlar soni</span> ko&apos;rsatiladi.{" "}
                      To&apos;rt xil yo&apos;nalish — har biri alohida rangda.{" "}
                      <span className="font-medium text-slate-700">Eng yangi testlar ro&apos;yxat boshida.</span>{" "}
                      <span className="font-medium text-emerald-800">Yechib bo&apos;lgan testlar yashil belgi bilan.</span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/testlar"
                  className="group relative inline-flex w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border border-slate-200/90 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-md shadow-slate-900/5 backdrop-blur-sm transition hover:border-blue-200/90 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-500/10 sm:w-auto sm:justify-start"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transition duration-500 group-hover:translate-x-full" />
                  <span className="relative">Barcha testlar</span>
                  <ChevronRight className="relative h-4 w-4 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </div>

              {tests.length === 0 ? (
                <div className="relative mt-8 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/40 py-16 text-center shadow-inner">
                  <p className="text-sm font-medium text-slate-500">{"Hozircha testlar yo'q."}</p>
                </div>
              ) : (
                <div className="relative mt-8 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
                  {TEST_CATALOG_ORDER.map((cat) => {
                    const meta = CATALOG_SECTION_META[cat];
                    const accent = CATALOG_PANEL_PREMIUM[cat];
                    const list = testsByCategory[cat] ?? [];
                    const total = catalogTotals[cat] ?? 0;
                    return (
                      <AccordionDetails
                        key={cat}
                        defaultOpen={cat === defaultOpenCatalogCategory}
                        className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-sm ring-1 ring-slate-100 transition duration-200 open:shadow-md open:ring-slate-200/80"
                        summary={(open) => (
                          <summary
                            className={cn(
                              "relative flex cursor-pointer list-none items-start justify-between gap-3 overflow-x-clip border-b border-white/50 px-3 py-4 outline-none transition hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:px-5",
                              "[&::-webkit-details-marker]:hidden",
                              accent.header,
                            )}
                          >
                            <div
                              className={cn(
                                "pointer-events-none absolute -right-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full blur-2xl",
                                accent.orb,
                              )}
                            />
                            <div className="relative min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-[15px] font-bold tracking-tight text-slate-900 sm:text-base">
                                  {meta.heading}
                                </h3>
                                <span className="rounded-full border border-white/60 bg-white/75 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-800 shadow-sm backdrop-blur-sm sm:text-xs">
                                  {total} ta test
                                </span>
                              </div>
                              <p className="relative mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-slate-600 sm:text-[13px]">
                                {meta.subtitle}
                              </p>
                            </div>
                            <ChevronDown
                              className={cn(
                                "relative mt-0.5 h-5 w-5 shrink-0 text-slate-600 transition-transform duration-200",
                                open && "rotate-180",
                              )}
                              aria-hidden
                            />
                          </summary>
                        )}
                      >
                        <div className="relative flex min-w-0 flex-1 flex-col bg-white/60 p-3 sm:p-5">
                          {list.length === 0 ? (
                            <p className="flex flex-1 items-center py-6 text-center text-xs font-medium text-slate-400">
                              Bu bo&apos;limda hozircha test yo&apos;q.
                            </p>
                          ) : (
                            <>
                              <ul className="min-w-0 space-y-3">
                                {list.map((t) => (
                                  <KabinetCatalogTestRow key={t.id} test={t} category={cat} />
                                ))}
                              </ul>
                              {(catalogTotals[cat] ?? 0) > CATALOG_MENU_MAX ? (
                                <Link
                                  href="/testlar"
                                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 py-2.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-blue-200/80 hover:bg-white hover:text-blue-700"
                                >
                                  <span>
                                    Yana {(catalogTotals[cat] ?? 0) - CATALOG_MENU_MAX} ta — barchasi
                                  </span>
                                  <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                                </Link>
                              ) : null}
                            </>
                          )}
                        </div>
                      </AccordionDetails>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp} id="liderlar" className="scroll-mt-24 lg:col-span-12 lg:scroll-mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">Leaderboard</h2>
          <Tabs defaultValue={gradeOk ? "g-rep" : "republic"} className="w-full min-w-0 gap-3">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-slate-100/90 p-1">
              {gradeOk ? (
                <>
                  <TabsTrigger
                    value="g-rep"
                    className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm sm:px-4 sm:text-sm"
                  >
                    {student.gradeLevel}-sinf · Respublika
                  </TabsTrigger>
                  <TabsTrigger
                    value="g-vil"
                    className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm sm:px-4 sm:text-sm"
                  >
                    {student.gradeLevel}-sinf · {shortViloyatLabel(student.viloyat)}
                  </TabsTrigger>
                </>
              ) : null}
              <TabsTrigger
                value="republic"
                className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm sm:px-4 sm:text-sm"
              >
                Barcha sinflar · Respublika
              </TabsTrigger>
              <TabsTrigger
                value="viloyat"
                className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm sm:px-4 sm:text-sm"
              >
                Barcha · {shortViloyatLabel(student.viloyat)}
              </TabsTrigger>
            </TabsList>
            {gradeOk ? (
              <>
                <TabsContent value="g-rep" className="mt-3 min-w-0">
                  <BoardTableBento
                    rows={gradeRepublicRows}
                    currentUserId={student.id}
                    title={`${student.gradeLevel}-sinf — Respublika TOP 15`}
                    subtitle="Faqat shu sinf o‘quchilari."
                  />
                </TabsContent>
                <TabsContent value="g-vil" className="mt-3 min-w-0">
                  <BoardTableBento
                    rows={gradeViloyatRows}
                    currentUserId={student.id}
                    title={`${student.gradeLevel}-sinf — ${student.viloyat}`}
                    subtitle="Viloyat ichida shu sinf."
                  />
                </TabsContent>
              </>
            ) : null}
            <TabsContent value="republic" className="mt-3 min-w-0">
              <BoardTableBento
                rows={republicRows}
                currentUserId={student.id}
                title="Respublika TOP 15"
                subtitle="Barcha sinflar — yig‘ma ball."
              />
            </TabsContent>
            <TabsContent value="viloyat" className="mt-3 min-w-0">
              <BoardTableBento
                rows={viloyatRows}
                currentUserId={student.id}
                title={`${student.viloyat} TOP`}
                subtitle="Barcha sinflar — mahalliy jadval."
              />
            </TabsContent>
          </Tabs>
        </motion.section>

        <motion.div {...fadeUp} className="min-w-0 lg:col-span-12">
          <KabinetRoadmap />
        </motion.div>

        <motion.section {...fadeUp} id="profil" className={cn("scroll-mt-24 p-6 lg:col-span-12 lg:scroll-mt-6", cardShell)}>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Profil</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Ism familiya</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{displayName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Sinf</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {gradeOk ? `${student.gradeLevel}-sinf` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Viloyat</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{student.viloyat}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Mobil</dt>
              <dd className="mt-0.5 font-mono text-xs text-slate-800">{formatPhoneDisplay(student.phone)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Ota-ona</dt>
              <dd className="mt-0.5 font-mono text-xs text-slate-800">{formatPhoneDisplay(student.parentPhone)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500">Telegram bildirishnomalari</dt>
              <dd className="mt-2 space-y-2">
                {student.telegramLinked ? (
                  <p className="text-sm font-medium text-emerald-800">
                    ✓ Ulangan
                    {student.telegramUsername ? (
                      <span className="ml-1 font-mono text-emerald-900">@{student.telegramUsername}</span>
                    ) : null}
                    . Test natijalari va yangiliklar shu yerga ham keladi.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Hozircha bot bilan bog‘lanmagansiz — shu sababli test tugagach Telegramga xabar ketmaydi.
                    </p>
                    <TelegramDeepLink variant="compact" />
                  </>
                )}
              </dd>
            </div>
          </dl>
        </motion.section>
      </div>
    </div>
  );
}
