import type { TournamentLeaderboardRow } from "@/lib/tournament-ranking";
import { cn } from "@/lib/utils";

export function TournamentLeaderboardTable({
  rows,
  currentUserId,
  title,
  subtitle,
}: {
  rows: TournamentLeaderboardRow[];
  currentUserId?: string;
  title: string;
  subtitle?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        <p className="mt-4 text-sm text-slate-500">Hozircha natijalar yo&apos;q.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md">
      <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-4 py-3">
        <h2 className="font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p> : null}
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 w-12">#</th>
            <th className="px-3 py-2">O&apos;quvchi</th>
            <th className="px-3 py-2 hidden sm:table-cell">Viloyat</th>
            <th className="px-3 py-2 text-right">Natija</th>
            <th className="px-3 py-2 text-right">Ball</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isMe = currentUserId === r.userId;
            return (
              <tr
                key={r.userId}
                className={cn(
                  "border-b border-slate-50 last:border-0",
                  isMe && "bg-amber-50/80",
                )}
              >
                <td className="px-3 py-2.5 font-bold tabular-nums text-slate-700">{r.rank}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">
                  {r.name}
                  {isMe ? (
                    <span className="ml-1 text-[10px] font-bold text-amber-700">(siz)</span>
                  ) : null}
                </td>
                <td className="hidden px-3 py-2.5 text-slate-600 sm:table-cell">{r.viloyat}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                  {r.score}/{r.total}
                </td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums text-amber-700">
                  {r.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
