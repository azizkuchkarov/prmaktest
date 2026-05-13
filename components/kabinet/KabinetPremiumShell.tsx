"use client";

import Link from "next/link";
import { startTransition, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Newspaper,
  PanelLeft,
  Target,
  Trophy,
  User,
  X,
} from "lucide-react";
import { logoutStudent } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

const nav = [
  { href: "#bosh", label: "Boshqaruv", icon: LayoutDashboard },
  { href: "#reyting", label: "Reyting", icon: Trophy },
  { href: "#tayyorgarlik", label: "Tayyorgarlik", icon: Target },
  { href: "#diagrammalar", label: "Diagrammalar", icon: BarChart3 },
  { href: "#testlar", label: "Testlar", icon: BookOpen },
  { href: "#liderlar", label: "Liderlar", icon: Award },
  { href: "#yangiliklar", label: "Yangiliklar", icon: Newspaper },
  { href: "#profil", label: "Profil", icon: User },
] as const;

type Props = {
  displayName: string;
  viloyat: string;
  ctaHref: string;
  ctaLabel: string;
  children: React.ReactNode;
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Asosiy menyu">
      {nav.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          href={href}
          onClick={() => onNavigate?.()}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700",
            "transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB] active:bg-[#2563EB]/15"
          )}
        >
          <Icon className="h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden />
          <span className="min-w-0 break-words">{label}</span>
        </a>
      ))}
      <Link
        href="/"
        onClick={() => onNavigate?.()}
        className="mt-2 flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        <Home className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        Bosh sahifa
      </Link>
    </nav>
  );
}

export function KabinetPremiumShell({ displayName, viloyat, ctaHref, ctaLabel, children }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Start narrow so desktop aside is not mounted until `matchMedia` runs (avoids ghost overlap on mobile). */
  const [isLg, setIsLg] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsLg(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (sheetOpen && isLg) {
      startTransition(() => setSheetOpen(false));
    }
  }, [isLg, sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const shortName = displayName.split(" ").filter(Boolean)[0] || "O'quvchi";

  const mobileMenuLayer =
    sheetOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Menyuni yopish"
              className="fixed inset-0 z-[10050] bg-black/30 [touch-action:manipulation] lg:hidden"
              onClick={() => setSheetOpen(false)}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Mobil menyu"
              className={cn(
                "fixed inset-y-0 left-0 z-[10060] flex h-[100dvh] w-[min(18.5rem,calc(100vw-1rem))] flex-col border-r border-white/60 bg-white shadow-2xl lg:hidden",
                "overscroll-contain pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                "animate-in slide-in-from-left duration-200"
              )}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-4 text-left">
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900">Menyu</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {shortName} · {viloyat}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 [touch-action:manipulation] active:bg-slate-50"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Yopish"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8">
                <NavLinks onNavigate={() => setSheetOpen(false)} />
                <div className="px-3 pt-4">
                  <form action={logoutStudent} autoComplete="off" suppressHydrationWarning>
                    <button
                      type="submit"
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Chiqish
                    </button>
                  </form>
                </div>
              </div>
            </aside>
          </>,
          document.body
        )
      : null;

  const asideClass = cn(
    "fixed left-0 top-0 z-40 flex h-[100dvh] w-[min(18rem,calc(100vw-1.5rem))] shrink-0 flex-col border-r border-white/60 bg-white shadow-xl shadow-slate-200/40",
    "transition-[transform,opacity] duration-300 ease-out"
  );

  return (
    <div className="min-h-[100dvh] w-full min-w-0 max-w-[100vw] overflow-x-clip bg-[#F8FAFC] text-slate-900">
      {isLg ? (
        <aside className={asideClass} aria-label="Kabinet navigatsiyasi">
          <div className="border-b border-slate-200/80 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">Prezident maktabi</p>
            <p className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900">Kabinet</p>
            <p className="truncate text-xs text-slate-500">{shortName}</p>
            <p className="mt-1 truncate text-[11px] font-medium text-[#2563EB]">{viloyat}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-2">
            <NavLinks />
          </div>
          <div className="shrink-0 border-t border-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form action={logoutStudent} autoComplete="off" suppressHydrationWarning>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Chiqish
              </button>
            </form>
          </div>
        </aside>
      ) : null}

      <div
        className={cn(
          "relative z-10 w-full min-w-0 max-w-[100vw]",
          isLg && "pl-[min(18rem,calc(100dvw-1.5rem))]"
        )}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/60 bg-[#F8FAFC]/90 px-3 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-800 shadow-sm [touch-action:manipulation] active:bg-slate-50"
            onClick={() => setSheetOpen((open) => !open)}
            aria-expanded={sheetOpen}
            aria-label={sheetOpen ? "Menyuni yopish" : "Menyuni ochish"}
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-bold text-slate-900">Kabinet</p>
            <p className="truncate text-[10px] font-medium text-[#2563EB]">{viloyat}</p>
          </div>
          <span className="w-11 shrink-0" aria-hidden />
        </header>

        <div
          className={cn(
            "relative w-full min-w-0 overflow-x-clip",
            "pb-[calc(6.25rem+env(safe-area-inset-bottom))] lg:pb-[max(2rem,env(safe-area-inset-bottom))]"
          )}
        >
          {children}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-[#F8FAFC]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.15)] backdrop-blur-md lg:hidden">
          <Link
            href={ctaHref}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-base font-bold text-white shadow-lg shadow-[#2563EB]/25 outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 active:brightness-95"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
      {mobileMenuLayer}
    </div>
  );
}
