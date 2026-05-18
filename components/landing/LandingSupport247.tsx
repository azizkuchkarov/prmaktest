"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Headphones, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LandingSupportModalForm } from "./LandingSupportModalForm";

type Props = {
  supportConfigured: boolean;
};

export function LandingSupport247({ supportConfigured }: Props) {
  const [open, setOpen] = useState(false);
  const [modalNonce, setModalNonce] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!supportConfigured) return null;

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed z-[45] flex flex-col items-end gap-2",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))]",
          "sm:bottom-8 sm:right-6",
        )}
      >
        <button
          type="button"
          onClick={() => {
            setModalNonce((n) => n + 1);
            setOpen(true);
          }}
          className={cn(
            "pointer-events-auto group relative flex min-h-[3.25rem] max-w-[calc(100vw-1.5rem)] items-center gap-2",
            "overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#312e81] px-3 py-3 sm:px-4",
            "text-left text-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.55)] ring-2 ring-white/25",
            "transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2",
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-20%,rgba(99,102,241,0.45),transparent_55%)] opacity-80" />
          <span className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Headphones className="h-5 w-5" aria-hidden />
          </span>
          <span className="relative min-w-0 px-0.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200/95">
              <Sparkles className="h-3 w-3 text-amber-300" aria-hidden />
              Yordam
            </span>
            <span className="mt-0.5 block text-sm font-bold leading-tight tracking-tight">24/7 qo&apos;llab-quvvatlash</span>
          </span>
        </button>
      </div>

      {mounted && open
        ? createPortal(<LandingSupportModalForm key={modalNonce} onClose={() => setOpen(false)} />, document.body)
        : null}
    </>
  );
}
