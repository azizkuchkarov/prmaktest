"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const cardShell =
  "min-w-0 rounded-3xl border border-white/60 bg-white shadow-xl shadow-slate-200/35 ring-1 ring-slate-200/50";

type Props = {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** `plain` — ichki kontent o‘z kartochkasida (masalan, diagrammalar) */
  variant?: "card" | "plain";
};

export function KabinetCollapsibleSection({
  id,
  title,
  subtitle,
  icon: Icon,
  defaultOpen = false,
  children,
  className,
  contentClassName,
  variant = "card",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId().replace(/:/g, "");

  return (
    <section id={id} className={cn("scroll-mt-kabinet-sticky", className)}>
      <div className={variant === "card" ? cardShell : undefined}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`kabinet-col-${panelId}`}
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-3 rounded-3xl text-left outline-none transition",
            "hover:bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-indigo-400/40",
            variant === "card" ? "px-5 py-4 sm:px-6 sm:py-5" : "px-1 py-3",
          )}
        >
          <span className="sr-only">
            {title} blokini {open ? "yopish" : "ochish"}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {Icon ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] shadow-lg shadow-indigo-500/25 ring-2 ring-white/60">
                <Icon className="h-5 w-5 text-white" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            variant === "card" && "border-t border-slate-100/90",
          )}
        >
          <div
            id={`kabinet-col-${panelId}`}
            className={cn("min-h-0 overflow-hidden", variant === "card" && "px-5 pb-5 pt-1 sm:px-6 sm:pb-6", contentClassName)}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
