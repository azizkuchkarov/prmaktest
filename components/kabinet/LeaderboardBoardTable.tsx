import type { LeaderboardRow } from "@/lib/student-ranking";
import { cn } from "@/lib/utils";

const cardShell =
  "min-w-0 rounded-3xl border border-white/60 bg-white shadow-xl shadow-slate-200/35 ring-1 ring-slate-200/50";

/** Kabinetdagi Leaderboard tab jadvali — o‘qituvchi virtual sinfi uchun qayta ishlatiladi */
export function LeaderboardBoardTable({
  rows,
  currentUserId,
  title,
  subtitle,
}: {
  rows: LeaderboardRow[];
  /** Berilmasa highlight yo‘q */
  currentUserId?: string;
  title: string;
  subtitle: string;
}) {
  const medal = (r: number) => {
    if (r === 1) return "🥇";
    if (r === 2) return "🥈";
    if (r === 3) return "🥉";
    return null;
  };

  const rankBadgeClass = (rank: number) => {
    if (rank === 1) {
      return "h-12 min-w-[3rem] rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/90 text-[1.7rem] leading-none shadow-sm ring-1 ring-amber-200/90 sm:h-[3.75rem] sm:min-w-[3.75rem] sm:text-[2.125rem] sm:rounded-[1.15rem]";
    }
    if (rank === 2) {
      return "h-12 min-w-[3rem] rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/90 text-[1.7rem] leading-none shadow-sm ring-1 ring-slate-200/90 sm:h-[3.75rem] sm:min-w-[3.75rem] sm:text-[2.125rem] sm:rounded-[1.15rem]";
    }
    if (rank === 3) {
      return "h-12 min-w-[3rem] rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 text-[1.7rem] leading-none shadow-sm ring-1 ring-orange-200/80 sm:h-[3.75rem] sm:min-w-[3.75rem] sm:text-[2.125rem] sm:rounded-[1.15rem]";
    }
    return "h-10 w-10 rounded-xl bg-slate-50 text-xs font-black tabular-nums sm:h-11 sm:w-11 sm:text-sm";
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
                "flex items-center gap-3 px-3 py-3 text-sm sm:gap-3 sm:py-3",
                currentUserId != null && r.userId === currentUserId
                  ? "bg-[#2563EB]/[0.06] ring-1 ring-inset ring-[#2563EB]/15"
                  : "bg-white",
              )}
            >
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center tabular-nums text-slate-700",
                  rankBadgeClass(r.rank),
                )}
                aria-label={`${r.rank}-o‘rin`}
              >
                <span className="select-none">{medal(r.rank) ?? r.rank}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{r.name}</p>
                <p className="truncate text-[10px] text-slate-500 sm:text-xs">{r.viloyat}</p>
              </div>
              <span className="shrink-0 font-mono text-sm font-bold text-[#2563EB] sm:text-base">{r.points}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
