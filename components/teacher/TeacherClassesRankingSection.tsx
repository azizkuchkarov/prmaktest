"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart, Trophy } from "lucide-react";
import type { TeacherVirtualClassRankingRow } from "@/lib/virtual-class-leaderboard";
import { formatUzInteger } from "@/lib/format-uzs";
import { cn } from "@/lib/utils";

const cardShell =
  "rounded-[1.65rem] border border-white/80 bg-white/80 p-6 shadow-xl shadow-indigo-950/[0.05] backdrop-blur-sm ring-1 ring-slate-200/55 sm:p-7";

function useNarrowChart() {
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

function barFillForRank(rank: number) {
  if (rank === 1) return "#ca8a04";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#ea580c";
  return "#818cf8";
}

function shortClassLabel(courseName: string, narrow: boolean) {
  const max = narrow ? 12 : 22;
  const t = courseName.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function AvgTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { full: string; tuman: string; avg: number; overallRank: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <p className="font-bold text-slate-900">{p.full}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{p.tuman}</p>
      <p className="mt-1.5 tabular-nums font-semibold text-indigo-700">
        O‘rtacha: {formatAvgPoints(p.avg)} ball · sinflar jadvalida #{p.overallRank}
      </p>
    </div>
  );
}

function SumTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { full: string; tuman: string; sum: number; overallRank: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <p className="font-bold text-slate-900">{p.full}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{p.tuman}</p>
      <p className="mt-1.5 tabular-nums font-semibold text-teal-700">
        Jami: {formatUzInteger(Math.round(p.sum))} ball · sinflar jadvalida #{p.overallRank}
      </p>
    </div>
  );
}

function formatAvgPoints(n: number) {
  const r = Math.round(n * 10) / 10;
  if (Number.isInteger(r)) return formatUzInteger(Math.round(r));
  return String(r).replace(".", ",");
}

type Props = {
  rows: TeacherVirtualClassRankingRow[];
};

export function TeacherClassesRankingSection({ rows }: Props) {
  const narrow = useNarrowChart();
  const yw = narrow ? 68 : 104;
  const tickSize = narrow ? 9 : 10;

  if (rows.length === 0) {
    return (
      <section className={cn(cardShell)}>
        <div className="flex flex-wrap items-start gap-4 border-b border-slate-100/90 pb-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-orange-500/35">
            <Trophy className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Sinflar reytingi</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Virtual sinf yarating — biriktirilgan testlar va faol o‘quvchilar bo‘yicha sinflaringizni bir-biriga
              qiyoslashingiz mumkin.
            </p>
          </div>
        </div>
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/60 py-10 text-center text-sm text-slate-500">
          Hozircha solishtirish uchun sinf yo‘q.
        </p>
      </section>
    );
  }

  const medal = (r: number) => {
    if (r === 1) return "🥇";
    if (r === 2) return "🥈";
    if (r === 3) return "🥉";
    return null;
  };

  const chartAvg = [...rows]
    .sort((a, b) => b.avgRankPoints - a.avgRankPoints)
    .map((r, idx) => ({
      name: shortClassLabel(r.courseName, narrow),
      full: r.courseName,
      tuman: r.tuman,
      avg: Math.round(r.avgRankPoints * 10) / 10,
      overallRank: r.rank,
      barOrder: idx + 1,
    }));

  const chartSum = [...rows]
    .sort((a, b) => b.sumRankPoints - a.sumRankPoints)
    .map((r, idx) => ({
      name: shortClassLabel(r.courseName, narrow),
      full: r.courseName,
      tuman: r.tuman,
      sum: r.sumRankPoints,
      overallRank: r.rank,
      barOrder: idx + 1,
    }));

  const hAvg = Math.max(narrow ? 200 : 240, 48 + chartAvg.length * (narrow ? 26 : 30));
  const hSum = Math.max(narrow ? 200 : 240, 48 + chartSum.length * (narrow ? 26 : 30));

  const bestAvg = rows.reduce((a, b) => (b.avgRankPoints > a.avgRankPoints ? b : a), rows[0]);
  const bestSum = rows.reduce((a, b) => (b.sumRankPoints > a.sumRankPoints ? b : a), rows[0]);

  return (
    <section className={cn(cardShell)}>
      <div className="flex flex-wrap items-start gap-4 border-b border-slate-100/90 pb-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-orange-500/35">
          <Trophy className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Sinflar reytingi</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Har bir virtual sinf uchun <strong className="text-slate-800">faol a‘zolar</strong> va{" "}
            <strong className="text-slate-800">biriktirilgan testlar</strong> bo‘yicha yig‘ilgan rank ballari (sinf sahifasi
            leaderboard bilan bir xil qoida). O‘rtacha ball — guruhdagi sog‘lom solishtirish; jami ball — jamoaviy{' '}
            faollik ko‘rsatkichi.
          </p>
        </div>
      </div>

      {rows.length === 1 ? (
        <p className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-[13px] leading-relaxed text-indigo-950">
          <strong>Yana birorta sinf qo‘shing</strong> — diagrammalar ikki va undan ortiq guruhda qiyoslash ma’nosini
          to‘liq ochadi.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:gap-5">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-indigo-50/90 to-white/80 p-4 ring-1 ring-indigo-100/80">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600/90">O‘rtacha ball</p>
          <p className="mt-2 truncate text-[15px] font-bold text-slate-900" title={bestAvg.courseName}>
            {bestAvg.courseName}
          </p>
          <p className="mt-1 font-mono text-2xl font-black tabular-nums text-indigo-700">{formatAvgPoints(bestAvg.avgRankPoints)}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-teal-50/90 to-white/80 p-4 ring-1 ring-teal-100/80">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700/90">Jami ball</p>
          <p className="mt-2 truncate text-[15px] font-bold text-slate-900" title={bestSum.courseName}>
            {bestSum.courseName}
          </p>
          <p className="mt-1 font-mono text-2xl font-black tabular-nums text-teal-700">
            {formatUzInteger(Math.round(bestSum.sumRankPoints))}
          </p>
        </div>
      </div>

      <div className="mt-8 grid w-full min-w-0 gap-8 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/60 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start gap-2">
              <BarChart3 className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">O‘rtacha rank ball</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  Faol o‘quvchi soniga bo‘lingan qiymat — turli hajmdagi sinflarni adolatli solishtirish.
                </p>
              </div>
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto p-2 sm:p-4">
            <div style={{ height: hAvg }} className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={hAvg} minWidth={0} debounce={80}>
                <BarChart data={chartAvg} layout="vertical" margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-slate-100" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: narrow ? 9 : 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={yw}
                    tick={{ fontSize: tickSize, fill: "#475569" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<AvgTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                  <Bar dataKey="avg" radius={[0, 8, 8, 0]} maxBarSize={narrow ? 20 : 24}>
                    {chartAvg.map((entry) => (
                      <Cell key={`${entry.full}-avg`} fill={barFillForRank(entry.barOrder)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/55 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start gap-2">
              <LineChart className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">Jami rank ball</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  Guruh bo‘yicha yig‘ma — katta sinflar va faol jamoalar ajralib turadi.
                </p>
              </div>
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto p-2 sm:p-4">
            <div style={{ height: hSum }} className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={hSum} minWidth={0} debounce={80}>
                <BarChart data={chartSum} layout="vertical" margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-slate-100" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: narrow ? 9 : 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={yw}
                    tick={{ fontSize: tickSize, fill: "#475569" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<SumTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                  <Bar dataKey="sum" radius={[0, 8, 8, 0]} maxBarSize={narrow ? 20 : 24}>
                    {chartSum.map((entry) => (
                      <Cell key={`${entry.full}-sum`} fill={barFillForRank(entry.barOrder)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-inner shadow-slate-100/90 ring-1 ring-slate-100">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">№</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">Virtual sinf</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">O‘rtacha</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">Jami</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">Faollar</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">Topshirgan</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">Testlar</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">Lider</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.virtualClassId}
                className="border-b border-slate-100/90 transition hover:bg-indigo-50/40 [&:last-child]:border-b-0"
              >
                <td className="px-4 py-3">
                  <span className="inline-flex min-w-[2.5rem] items-center justify-center font-mono text-xs font-black tabular-nums text-slate-800">
                    {medal(row.rank) ?? row.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-[14rem] truncate font-semibold text-slate-900" title={row.courseName}>
                    {row.courseName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{row.tuman}</p>
                </td>
                <td className="px-4 py-3 font-mono text-sm font-bold tabular-nums text-indigo-700">
                  {formatAvgPoints(row.avgRankPoints)}
                </td>
                <td className="px-4 py-3 font-mono text-sm font-bold tabular-nums text-teal-700">
                  {formatUzInteger(Math.round(row.sumRankPoints))}
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700">
                  {formatUzInteger(row.activeStudentCount)}
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700">
                  {formatUzInteger(row.learnersWithAttempts)}
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700">
                  {formatUzInteger(row.assignedTestCount)}
                </td>
                <td className="max-w-[10rem] px-4 py-3">
                  {row.topStudentDisplayName ? (
                    <>
                      <p className="truncate text-xs font-medium text-slate-800">{row.topStudentDisplayName}</p>
                      <p className="font-mono text-[11px] font-bold tabular-nums text-slate-600">
                        {formatUzInteger(row.topStudentPoints)} ball
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/oqituvchi/sinflar/${row.virtualClassId}`}
                    className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm ring-1 ring-slate-100 transition hover:bg-indigo-50 hover:ring-indigo-200"
                  >
                    Boshqarish
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
