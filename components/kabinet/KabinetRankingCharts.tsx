"use client";

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
import type { LeaderboardRow, ViloyatTotalRow } from "@/lib/student-ranking";

type Props = {
  republicByViloyat: ViloyatTotalRow[];
  userViloyat: string;
  viloyatTop: LeaderboardRow[];
  currentUserId: string;
};

const barRepublic = "#93c5fd";
const barRepublicYou = "#2563EB";
const barViloyat = "#c4b5fd";
const barViloyatYou = "#10B981";

function useNarrowScreen() {
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

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <p className="font-bold text-slate-900">{label}</p>
      <p className="mt-0.5 tabular-nums font-semibold text-teal-700">{payload[0]?.value?.toLocaleString("uz-UZ")} ball</p>
    </div>
  );
}

function shortViloyatLabel(name: string) {
  return name.replace(/\s+viloyati\s*$/i, "").replace(/^Toshkent shahri$/i, "Toshkent sh.");
}

export function KabinetRankingCharts({ republicByViloyat, userViloyat, viloyatTop, currentUserId }: Props) {
  const narrow = useNarrowScreen();
  const yw = narrow ? 62 : 88;
  const tickSize = narrow ? 9 : 10;

  const repData = republicByViloyat.slice(0, 14).map((r) => ({
    name: shortViloyatLabel(r.viloyat),
    full: r.viloyat,
    ball: r.totalPoints,
    sizniki: r.viloyat === userViloyat,
  }));

  const vilData = viloyatTop.map((r) => ({
    name: r.name.length > (narrow ? 10 : 14) ? `${r.name.slice(0, narrow ? 8 : 12)}…` : r.name,
    full: r.name,
    ball: r.points,
    sizniki: r.userId === currentUserId,
  }));

  const repHeight = Math.max(narrow ? 200 : 220, 40 + repData.length * (narrow ? 24 : 28));
  const vilHeight = Math.max(narrow ? 200 : 220, 40 + vilData.length * (narrow ? 24 : 28));

  const chartInner = "w-full min-w-0 max-w-full";

  return (
    <div className="grid w-full min-w-0 gap-6 lg:grid-cols-2">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/60 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">Respublika bo‘yicha</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
            Viloyatlar yig‘ma rank ballari. <strong className="text-teal-700">{userViloyat}</strong> alohida rangda.
          </p>
        </div>
        <div className="w-full min-w-0 overflow-hidden p-2 sm:p-4">
          {repData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500 sm:py-16">Hozircha viloyatlar bo‘yicha ma’lumot yo‘q.</p>
          ) : (
            <div className="w-full min-w-0">
              <div className={chartInner} style={{ height: repHeight }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={80}>
                  <BarChart data={repData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
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
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                    <Bar dataKey="ball" name="Ball" radius={[0, 6, 6, 0]} maxBarSize={narrow ? 18 : 22}>
                      {repData.map((entry, i) => (
                        <Cell key={i} fill={entry.sizniki ? barRepublicYou : barRepublic} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/60 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">Viloyatingiz bo‘yicha</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
            {userViloyat}: yetakchilar. <strong className="text-indigo-700">Siz</strong> yashil ustunda.
          </p>
        </div>
        <div className="w-full min-w-0 overflow-hidden p-2 sm:p-4">
          {vilData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500 sm:py-16">Viloyatingizda hozircha reyting yo‘q.</p>
          ) : (
            <div className="w-full min-w-0">
              <div className={chartInner} style={{ height: vilHeight }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={80}>
                  <BarChart data={vilData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-slate-100" vertical={false} />
                    <XAxis type="number" tick={{ fontSize: narrow ? 9 : 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={narrow ? 68 : 96}
                      tick={{ fontSize: tickSize, fill: "#475569" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as { full?: string; ball?: number };
                        return (
                          <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
                            <p className="font-bold text-slate-900">{row.full}</p>
                            <p className="mt-0.5 tabular-nums font-semibold text-indigo-700">
                              {row.ball?.toLocaleString("uz-UZ")} ball
                            </p>
                          </div>
                        );
                      }}
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                    />
                    <Bar dataKey="ball" name="Ball" radius={[0, 6, 6, 0]} maxBarSize={narrow ? 18 : 22}>
                      {vilData.map((entry, i) => (
                        <Cell key={i} fill={entry.sizniki ? barViloyatYou : barViloyat} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
