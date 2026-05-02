"use client";

import Link from "next/link";
import { startTransition, useEffect, useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  MapPin,
  Newspaper,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeaderboardRow, StudentRankSummary, ViloyatTotalRow } from "@/lib/student-ranking";
import { formatPhoneDisplay } from "@/lib/phone";
import type { RadarSubjectPoint, ReadinessStats, WeekProgressPoint } from "@/lib/kabinet-analytics";
import { KabinetRankingCharts } from "@/components/kabinet/KabinetRankingCharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  questionsCount: number;
  stage: string;
  updatedAt: string;
};

export type KabinetBentoStudent = {
  id: string;
  phone: string;
  viloyat: string;
  firstName: string;
  lastName: string;
  parentPhone: string;
};

type Props = {
  student: KabinetBentoStudent;
  displayName: string;
  rank: StudentRankSummary;
  republicRows: LeaderboardRow[];
  viloyatRows: LeaderboardRow[];
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

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60", className)}
      style={{ minHeight: 220 }}
      aria-hidden
    />
  );
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

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

  if (!mounted) return <ChartSkeleton className="h-[200px] w-full" />;

  if (repData.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Hozircha viloyatlar bo‘yicha ma’lumot yo‘q.</p>;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="h-[min(72vw,320px)] w-full min-w-0 sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160} debounce={50}>
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
                    <p className="mt-0.5 font-semibold text-[#2563EB]">{payload[0]?.value?.toLocaleString("uz-UZ")} ball</p>
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

export function KabinetBentoContent({
  student,
  displayName,
  rank,
  republicRows,
  viloyatRows,
  republicViloyatTotals,
  news,
  tests,
  weekly,
  radar,
  readiness,
}: Props) {
  const [chartsReady, setChartsReady] = useState(false);
  useEffect(() => {
    startTransition(() => setChartsReady(true));
  }, []);

  const firstName = displayName.split(" ").filter(Boolean)[0] || "do‘st";
  const nextTest = tests.find((t) => t.questionsCount > 0) ?? tests[0];
  const radarHasData = radar.some((d) => d.fullMark > 0);

  const donutData = useMemo(() => {
    const p = Math.max(0, Math.min(100, readiness.pct));
    return [
      { name: "Tayyor", value: p },
      { name: "Qolgan", value: Math.max(0, 100 - p) },
    ];
  }, [readiness.pct]);

  return (
    <div className="relative mx-auto w-full max-w-6xl min-w-0 space-y-4 overflow-x-clip py-5 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:space-y-5 sm:px-6 sm:py-7 lg:space-y-6 lg:py-9">
      <div
        className="pointer-events-none fixed left-1/2 top-0 z-0 h-[min(42vh,320px)] w-[min(100vw,520px)] max-w-[100vw] -translate-x-1/2 opacity-90"
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
              <Badge className="rounded-xl border-0 bg-[#10B981]/15 font-bold text-[#059669]">Rank ball: {rank.totalPoints}</Badge>
            </div>
            {nextTest && nextTest.questionsCount > 0 ? (
              <Link
                href={`/testlar/${nextTest.id}/boshlash`}
                className="hidden w-full min-[480px]:inline-flex sm:w-auto sm:shrink-0 min-[480px]:max-w-xs lg:inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/20 transition hover:brightness-105 active:brightness-95"
              >
                Testni boshlash
                <ArrowRight className="h-4 w-4" />
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
        </Card>
      </motion.section>

      <div className="relative grid auto-rows-min gap-4 min-w-0 lg:grid-cols-12 lg:gap-5">
        <motion.section {...fadeUp} id="reyting" className="scroll-mt-24 lg:col-span-4 lg:scroll-mt-6">
          <div className={cn("p-5", cardShell)}>
            <div className="flex items-center gap-2 text-slate-600">
              <Trophy className="h-5 w-5 text-[#F59E0B]" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Reyting</span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {rank.republicRank != null ? (
                <>
                  {rank.republicRank}
                  <span className="ml-1 text-lg font-semibold text-slate-400">respublika</span>
                </>
              ) : (
                <span className="text-xl text-slate-400">—</span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-600">Butun mamlakat bo‘yicha o‘rin.</p>
            <div className="mt-4 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Viloyat</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {rank.viloyatRank != null ? (
                  <>
                    {rank.viloyatRank}
                    <span className="ml-1 text-base font-semibold text-slate-400">-o‘rin</span>
                  </>
                ) : (
                  <span className="text-lg text-slate-400">—</span>
                )}
              </p>
              <p className="text-xs text-slate-600">{student.viloyat}</p>
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
                      href={`/testlar/${nextTest.id}/boshlash`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1d4ed8]"
                    >
                      Boshlash <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                  <Link
                    href={`/testlar/${nextTest.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batafsil
                  </Link>
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
          className="scroll-mt-24 space-y-4 lg:col-span-12 lg:scroll-mt-6"
        >
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Diagrammalar</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Fanlar bo‘yicha kuchli tomonlar, haftalik progress va tayyorgarlik taqsimoti.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
            <div className={cn("p-4 sm:p-5 lg:col-span-7", cardShell)}>
              <h3 className="text-sm font-bold text-slate-900">Fanlar bo‘yicha</h3>
              <p className="text-[11px] text-slate-600">Radar — o‘rtacha foiz (testlar bo‘yicha).</p>
              <div className="relative mt-3 w-full min-h-[240px]">
                {!chartsReady ? (
                  <ChartSkeleton className="h-[260px] w-full" />
                ) : !radarHasData ? (
                  <div className="flex h-[260px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center text-sm text-slate-500">
                    Hozircha fan bo‘yicha ma’lumot yo‘q. Test topshirgach diagramma paydo bo‘ladi.
                  </div>
                ) : (
                  <div className="h-[min(280px,55vw)] w-full min-w-0 sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={50}>
                      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radar}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          tickLine={false}
                        />
                        <Radar
                          name="Foiz"
                          dataKey="fullMark"
                          stroke="#2563EB"
                          fill="#2563EB"
                          fillOpacity={0.35}
                        />
                        <Tooltip
                          content={({ payload }) =>
                            payload?.[0] ? (
                              <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-md">
                                <span className="font-semibold text-slate-900">{String(payload[0].payload?.subject)}</span>
                                <span className="ml-2 text-[#2563EB]">{payload[0].value}%</span>
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

            <div className={cn("p-4 sm:p-5 lg:col-span-5", cardShell)}>
              <h3 className="text-sm font-bold text-slate-900">Tayyorgarlik ulushi</h3>
              <p className="text-[11px] text-slate-600">Donut — umumiy tayyorgarlik foizi.</p>
              <div className="relative mx-auto mt-2 h-[220px] w-full max-w-[280px] min-w-0 sm:h-[240px]">
                {!chartsReady ? (
                  <ChartSkeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={50}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}
                        cornerRadius={6}
                      >
                        <Cell fill="#2563EB" />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                      <Tooltip
                        formatter={(v: number, name) => [`${Math.round(Number(v))}%`, name]}
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={cn("p-4 sm:p-5 lg:col-span-12", cardShell)}>
              <h3 className="text-sm font-bold text-slate-900">Haftalik progress</h3>
              <p className="text-[11px] text-slate-600">So‘nggi haftalar — o‘rtacha test foizi.</p>
              <div className="mt-3 h-[200px] w-full min-w-0 sm:h-[220px]">
                {!chartsReady ? (
                  <ChartSkeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180} debounce={50}>
                    <LineChart data={weekly} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        labelFormatter={(l) => `Hafta: ${l}`}
                        formatter={(v: number) => [`${v}%`, "O‘rtacha"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#10B981", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={cn("min-w-0 overflow-x-clip lg:col-span-12", cardShell)}>
              <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                <h3 className="text-sm font-bold text-slate-900">Viloyat va respublika</h3>
                <p className="mt-1 text-[11px] text-slate-600">Bar chart — yig‘ma ballar bilan taqqoslash.</p>
              </div>
              <div className="p-3 sm:p-4 lg:hidden">
                <CompactRankingBar republicByViloyat={republicViloyatTotals} userViloyat={student.viloyat} />
              </div>
              <div className="hidden p-3 sm:p-4 lg:block">
                {!chartsReady ? (
                  <ChartSkeleton className="h-[280px]" />
                ) : (
                  <KabinetRankingCharts
                    republicByViloyat={republicViloyatTotals}
                    userViloyat={student.viloyat}
                    viloyatTop={viloyatRows}
                    currentUserId={student.id}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp} id="testlar" className="scroll-mt-24 lg:col-span-12 lg:scroll-mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
                <BookOpen className="h-7 w-7 text-[#2563EB]" />
                Testlar
              </h2>
              <p className="mt-1 text-sm text-slate-600">Nashr etilgan testlardan boshlang.</p>
            </div>
            <Link href="/testlar" className="text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
              Katalog →
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {tests.length === 0 ? (
              <li className={cn("col-span-full py-14 text-center text-sm text-slate-500", cardShell)}>
                {"Hozircha testlar yo'q."}
              </li>
            ) : (
              tests.map((t) => (
                <li key={t.id}>
                  <div className={cn("flex h-full flex-col p-5", cardShell)}>
                    <h3 className="font-semibold text-slate-900">{t.title}</h3>
                    {t.subject ? <p className="mt-1 text-xs font-semibold text-[#7C3AED]">{t.subject}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                        <Clock className="h-3 w-3" />
                        {t.durationMinutes} daq
                      </span>
                      <span className="rounded-full bg-[#2563EB]/10 px-2 py-0.5 font-semibold text-[#1d4ed8]">
                        {t.questionsCount} savol
                      </span>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                      {t.questionsCount > 0 ? (
                        <Link
                          href={`/testlar/${t.id}/boshlash`}
                          className="inline-flex min-h-11 items-center gap-1 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-105"
                        >
                          Boshlash <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{"Savollar yo'q"}</span>
                      )}
                      <Link href={`/testlar/${t.id}`} className="text-xs font-semibold text-[#2563EB]">
                        Batafsil
                      </Link>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </motion.section>

        <motion.section {...fadeUp} id="liderlar" className="scroll-mt-24 lg:col-span-12 lg:scroll-mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">Leaderboard</h2>
          <Tabs defaultValue="republic" className="w-full min-w-0 gap-3">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-slate-100/90 p-1">
              <TabsTrigger
                value="republic"
                className="rounded-xl px-4 py-2 font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm"
              >
                Respublika TOP
              </TabsTrigger>
              <TabsTrigger
                value="viloyat"
                className="rounded-xl px-4 py-2 font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm"
              >
                {shortViloyatLabel(student.viloyat)}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="republic" className="mt-3 min-w-0">
              <BoardTableBento
                rows={republicRows}
                currentUserId={student.id}
                title="Respublika TOP 15"
                subtitle="Eng yuqori yig‘ma ball."
              />
            </TabsContent>
            <TabsContent value="viloyat" className="mt-3 min-w-0">
              <BoardTableBento
                rows={viloyatRows}
                currentUserId={student.id}
                title={`${student.viloyat} TOP`}
                subtitle="Mahalliy jadval."
              />
            </TabsContent>
          </Tabs>
        </motion.section>

        <motion.section {...fadeUp} id="yangiliklar" className="scroll-mt-24 lg:col-span-12 lg:scroll-mt-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
                <Newspaper className="h-7 w-7 text-[#2563EB]" />
                Yangiliklar
              </h2>
              <p className="mt-1 text-sm text-slate-600">Platforma yangilanishlari.</p>
            </div>
            <Link href="/yangiliklar" className="shrink-0 text-sm font-semibold text-[#2563EB]">
              Barchasi →
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.length === 0 ? (
              <li className={cn("col-span-full py-14 text-center text-sm text-slate-500", cardShell)}>
                {"Hozircha yangiliklar yo'q."}
              </li>
            ) : (
              news.map((n) => (
                <li key={n.id}>
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

        <motion.section {...fadeUp} id="profil" className={cn("scroll-mt-24 p-6 lg:col-span-12 lg:scroll-mt-6", cardShell)}>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Profil</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Ism familiya</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{displayName}</dd>
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
          </dl>
        </motion.section>
      </div>
    </div>
  );
}
