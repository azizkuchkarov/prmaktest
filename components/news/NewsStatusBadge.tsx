import { cn } from "@/lib/utils";

type Props = { isRead: boolean; className?: string };

export function NewsStatusBadge({ isRead, className }: Props) {
  return isRead ? (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80",
        className,
      )}
    >
      O&apos;qilgan
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80",
        className,
      )}
    >
      New
    </span>
  );
}
