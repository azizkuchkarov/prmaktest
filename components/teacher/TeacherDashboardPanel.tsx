"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  School,
  Sparkles,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import type { TeacherDashboardPayload } from "@/lib/teacher-dashboard";
import { formatUzDateTime, formatUzInteger } from "@/lib/format-uzs";
import { cn } from "@/lib/utils";

const shell =
  "rounded-[1.65rem] border border-white/80 bg-white/80 shadow-xl shadow-indigo-950/[0.05] backdrop-blur-sm ring-1 ring-slate-200/55";

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return narrow;
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(shell, "flex min-w-0 flex-col p-5 sm:p-6", className)}>
      <h3 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h3>
      {subtitle ? <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">{subtitle}</p> : null}
      <div className="mt-4 min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SimpleTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg">
      {label ? <p className="font-bold text-slate-900">{label}</p> : null}
      <p className="mt-0.5 font-semibold tabular-nums text-indigo-700">
        {valueLabel ?? "Qiymat"}: {formatUzInteger(Number(payload[0]?.value))}
      </p>
    </div>
  );
}

function formatActivityWhen(iso: string) {
  const label = formatUzDateTime(iso);
  return label || iso;
}

type Props = {
  data: TeacherDashboardPayload;
};

export function TeacherDashboardPanel({ data }: Props) {
  const narrow = useNarrow();
  const { kpis, membershipSlices, activeByClass, growthRanking, weeklyActivity, classRankingTop, recentActivity } =
    data;

  const yw = narrow ? 72 : 96;
  const barH = Math.max(200, 44 + activeByClass.length * (narrow ? 22 : 26));
  const rankBarH = Math.max(180, 44 + Math.min(classRankingTop.length, 6) * 28);

  const topRankChart = classRankingTop.slice(0, 6).map((r) => ({
    name: r.courseName.length > (narrow ? 10 : 16) ? `${r.courseName.slice(0, narrow ? 8 : 14)}…` : r.courseName,
    full: r.courseName,
    avg: Math.round(r.avgRankPoints * 10) / 10,
    sum: r.sumRankPoints,
  }));

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-[1.65rem] border border-white/80 bg-gradient-to-br from-[#1e1b4b]/95 via-indigo-800/92 to-teal-800/85 p-8 text-white shadow-2xl shadow-indigo-900/40 ring-1 ring-white/15 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-100 ring-1 ring-white/25">
              <Sparkles className="size-3.5" aria-hidden />
              O‘qituvchi dashboard
            </p>
            <h1 className="mt-4 text-pretty text-[1.85rem] font-bold leading-[1.1] tracking-tight sm:text-4xl">
              Virtual sinflar markazi — diagrammalar va o‘sish
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-indigo-100/95">
              Faol o‘quvchilar, testlar, haftalik topshirishlar va sinflar reytingi bir ko‘rinishda. Batafsil jadval uchun{" "}
              <Link href="/oqituvchi/sinflar-reytingi" className="font-semibold text-white underline underline-offset-2">
                Sinflar reytingi
              </Link>{" "}
              sahifasiga o‘ting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/oqituvchi/sinfxonalar"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold backdrop-blur-md transition hover:bg-white/20"
            >
              <School className="size-4" aria-hidden />
              Sinfxonalar
            </Link>
            <Link
              href="/oqituvchi/sinflar-reytingi"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-500/20 px-4 py-2.5 text-sm font-bold backdrop-blur-md transition hover:bg-amber-500/30"
            >
              <Trophy className="size-4" aria-hidden />
              Reyting
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          { icon: School, label: "Virtual sinflar", value: kpis.classesCount, tone: "text-indigo-600" },
          { icon: Users, label: "Faol o‘quvchilar", value: kpis.activeStudents, tone: "text-teal-600" },
          { icon: UserPlus, label: "Kutilmoqda", value: kpis.pendingMemberships, tone: "text-amber-600" },
          { icon: BookOpenCheck, label: "Biriktirilgan testlar", value: kpis.assignedTestsTotal, tone: "text-violet-600" },
          { icon: TrendingUp, label: "Rank ball (7 kun / jami)", value: kpis.totalRankPoints, tone: "text-emerald-600" },
          { icon: Activity, label: "Topshirishlar (7 kun)", value: kpis.attemptsLast7d, tone: "text-blue-600" },
        ].map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className={cn(shell, "p-4 sm:p-5")}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <Icon className={cn("size-4 shrink-0 opacity-80", tone)} aria-hidden />
            </div>
            <p className="mt-3 font-mono text-2xl font-black tabular-nums text-slate-900 sm:text-3xl">
              {formatUzInteger(value)}
            </p>
            {label === "Faol o‘quvchilar" && kpis.newActiveMembers30d > 0 ? (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                +{formatUzInteger(kpis.newActiveMembers30d)} so‘nggi 30 kun
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="A‘zolar holati" subtitle="Barcha sinflar bo‘yicha so‘rovlar va faollar">
          {membershipSlices.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Hozircha a‘zo yo‘q.</p>
          ) : (
            <div className="mx-auto h-[220px] w-full max-w-[280px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={membershipSlices}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {membershipSlices.map((s) => (
                      <Cell key={s.key} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, _n, p) => [formatUzInteger(v), (p as { payload?: { label?: string } }).payload?.label]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-600">
                {membershipSlices.map((s) => (
                  <li key={s.key} className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.label} ({formatUzInteger(s.count)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Faol o‘quvchilar sinf bo‘yicha" subtitle="Har virtual sinfdagi ACTIVE a‘zolar">
          {activeByClass.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Sinf hali yoʻq.</p>
          ) : (
            <div style={{ height: barH }} className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={barH}>
                <BarChart data={activeByClass} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-slate-100" vertical={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: narrow ? 9 : 10 }} />
                  <YAxis type="category" dataKey="shortName" width={yw} tick={{ fontSize: narrow ? 9 : 10 }} />
                  <Tooltip content={<SimpleTooltip valueLabel="O‘quvchi" />} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-7"
          title="Haftalik faollik"
          subtitle="So‘nggi 7 kun — virtual sinf testlaridagi topshirishlar va rank ball"
        >
          <div className="h-[240px] w-full min-w-0 sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="attemptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                <XAxis dataKey="label" tick={{ fontSize: narrow ? 8 : 9 }} interval={narrow ? 1 : 0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={32} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const att = Number(payload.find((p) => p.dataKey === "attempts")?.value ?? 0);
                    const pts = Number(payload.find((p) => p.dataKey === "rankPoints")?.value ?? 0);
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                        <p className="font-bold text-slate-900">{label}</p>
                        <p className="text-indigo-700">Topshirish: {formatUzInteger(att)}</p>
                        <p className="text-teal-700">Ball: {formatUzInteger(pts)}</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="attempts" stroke="#6366f1" fill="url(#attemptGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="rankPoints" stroke="#14b8a6" fill="none" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          className="lg:col-span-5"
          title="Sinflar o‘sishi (30 kun)"
          subtitle="Yangi faol a‘zolar — qaysi sinf tezroq kengaymoqda"
        >
          {growthRanking.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Ma’lumot yoʻq.</p>
          ) : (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto overscroll-contain pr-1">
              {growthRanking.slice(0, 8).map((g, i) => (
                <li key={g.virtualClassId}>
                  <Link
                    href={`/oqituvchi/sinflar/${g.virtualClassId}`}
                    className="block rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-indigo-200 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {i + 1}. {g.courseName}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">Markaz: {g.tuman}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        +{formatUzInteger(g.newActive30d)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                        style={{ width: `${Math.min(100, Math.max(8, g.growthRate))}%` }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {formatUzInteger(g.activeTotal)} faol · o‘sish {formatUzInteger(g.growthRate)}%
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Sinflar reytingi — o‘rtacha ball"
          subtitle="TOP sinflar (biriktirilgan testlar bo‘yicha)"
        >
          {topRankChart.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Reyting uchun sinf va test kerak.</p>
          ) : (
            <div style={{ height: rankBarH }} className="w-full">
              <ResponsiveContainer width="100%" height={rankBarH}>
                <BarChart data={topRankChart} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-slate-100" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={yw} tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0]?.payload as { full?: string; avg?: number };
                      return (
                        <div className="rounded-xl border bg-white px-3 py-2 text-xs shadow-lg">
                          <p className="font-bold">{p?.full}</p>
                          <p className="text-indigo-700">O‘rtacha: {p?.avg}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avg" fill="#ca8a04" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <Link
            href="/oqituvchi/sinflar-reytingi"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
          >
            To‘liq reyting va jadval
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </ChartCard>

        <ChartCard title="So‘nggi harakatlar" subtitle="A‘zolar, testlar va topshirishlar">
          {recentActivity.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Hozircha voqealar yoʻq.</p>
          ) : (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto overscroll-contain">
              {recentActivity.map((ev) => {
                const inner = (
                  <>
                    <p className="truncate text-sm font-semibold text-slate-900">{ev.title}</p>
                    <p className="truncate text-[11px] text-slate-600">{ev.subtitle}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatActivityWhen(ev.atIso)}</p>
                  </>
                );
                return (
                  <li key={ev.id}>
                    {ev.href ? (
                      <Link
                        href={ev.href}
                        className="block rounded-xl border border-slate-100 bg-white/60 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-slate-100 bg-white/60 p-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
