"use client";

import { useEffect, useLayoutEffect, useState, startTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Home, LayoutDashboard, LogOut, PanelLeft, School, Trophy, X } from "lucide-react";
import { logoutStudent } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

type RoleBadge = "teacher" | "pending";

type Props = {
  displayName: string;
  viloyat: string;
  phoneDisplay: string;
  roleBadge: RoleBadge;
  /** Sinflarda ko‘rilmagan yangi o‘quvchi so‘rovlari */
  virtualSinflarNewCount?: number;
  children: React.ReactNode;
};

const navItems = [
  { href: "/oqituvchi", label: "Bosh sahifa", icon: Home, kind: "home" as const },
  { href: "/oqituvchi/sinfxonalar", label: "Sinfxonalar", icon: School, kind: "rooms" as const },
  { href: "/oqituvchi/sinflar-reytingi", label: "Sinflar reytingi", icon: Trophy, kind: "ranking" as const },
];

function NavLinks({
  onNavigate,
  virtualSinflarNewCount = 0,
}: {
  onNavigate?: () => void;
  virtualSinflarNewCount?: number;
}) {
  const pathname = usePathname() || "";

  const linkClass =
    "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-500/[0.07] hover:to-violet-500/[0.09] hover:text-indigo-950 hover:shadow-sm hover:ring-1 hover:ring-white/60 active:scale-[0.99]";
  const iconWrap =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-slate-100 text-indigo-600 shadow-inner ring-1 ring-white/90";

  return (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label="O‘qituvchi menyusi">
      {navItems.map(({ href, label, icon: Icon, kind }) => {
        const active =
          kind === "home"
            ? pathname === "/oqituvchi"
            : kind === "rooms"
              ? pathname === "/oqituvchi/sinfxonalar" || pathname.startsWith("/oqituvchi/sinflar/")
              : pathname === "/oqituvchi/sinflar-reytingi";
        const showNew = kind === "rooms" && virtualSinflarNewCount > 0;
        return (
          <Link
            key={`${href}-${kind}`}
            href={href}
            onClick={() => onNavigate?.()}
            className={cn(linkClass, active && "bg-white/80 text-indigo-950 ring-1 ring-indigo-200/70 shadow-sm")}
          >
            <span className={cn(iconWrap, kind === "ranking" && "text-amber-600")}>
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 break-words">{label}</span>
            {showNew ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80">
                {virtualSinflarNewCount > 9 ? "9+" : virtualSinflarNewCount} New
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function TeacherPremiumShell({
  displayName,
  viloyat,
  phoneDisplay,
  roleBadge,
  virtualSinflarNewCount = 0,
  children,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLg, setIsLg] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const shortName = displayName.split(" ").filter(Boolean)[0] || "O‘qituvchi";

  const mobileLayer =
    sheetOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Menyuni yopish"
              className="fixed inset-0 z-[10050] bg-slate-950/35 backdrop-blur-[2px] [touch-action:manipulation] lg:hidden"
              onClick={() => setSheetOpen(false)}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Mobil menyu"
              className={cn(
                "fixed inset-y-0 left-0 z-[10060] flex h-[100dvh] w-[min(19rem,calc(100vw-1rem))] flex-col border-r border-white/90 bg-white/[0.92] shadow-2xl shadow-indigo-950/20 backdrop-blur-2xl lg:hidden",
                "overscroll-contain pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                "animate-in slide-in-from-left duration-200",
              )}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100/80 px-4 py-4 text-left">
                <div className="min-w-0">
                  <p className="text-base font-bold tracking-tight text-slate-900">O‘qituvchi kabineti</p>
                  <p className="mt-0.5 text-xs text-slate-500">{shortName}</p>
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
                <NavLinks
                  onNavigate={() => setSheetOpen(false)}
                  virtualSinflarNewCount={virtualSinflarNewCount}
                />
                <div className="px-3 pt-4">
                  <form action={logoutStudent} autoComplete="off" suppressHydrationWarning>
                    <button
                      type="submit"
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200/90 bg-gradient-to-b from-red-50 to-white py-3 text-sm font-bold text-red-700 shadow-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      Chiqish
                    </button>
                  </form>
                </div>
              </div>
            </aside>
          </>,
          document.body,
        )
      : null;

  const asideClass =
    "fixed left-0 top-0 z-40 flex h-[100dvh] w-[min(18.5rem,calc(100vw-1.25rem))] shrink-0 flex-col border-r border-white/85 bg-white/70 shadow-[8px_0_40px_-12px_rgba(30,27,102,0.18)] backdrop-blur-2xl";

  const roleLabel =
    roleBadge === "pending"
      ? { text: "Tasdiqlanmoqda", className: "bg-amber-500/15 text-amber-900 ring-amber-300/60" }
      : { text: "Tasdiqlangan o‘qituvchi", className: "bg-emerald-500/12 text-emerald-900 ring-emerald-300/55" };

  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-hidden text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[#f6f7fb]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_100%_50%,rgba(45,212,191,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_90%,rgba(139,92,246,0.07),transparent_45%)]" />
      </div>

      {isLg ? (
        <aside className={asideClass} aria-label="Navigatsiya">
          <div className="border-b border-slate-200/50 px-4 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-teal-500 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white/80">
                <GraduationCap className="size-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600/95">
                  O‘qituvchi kabineti
                </p>
                <p className="truncate text-lg font-bold tracking-tight text-slate-900">Premium</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 rounded-2xl border border-white/80 bg-white/60 p-3 shadow-inner shadow-white/80 ring-1 ring-slate-200/60">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="truncate text-[11px] tabular-nums text-slate-500">{phoneDisplay}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200/80">
                  {viloyat}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                    roleLabel.className,
                  )}
                >
                  {roleLabel.text}
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-3">
            <NavLinks virtualSinflarNewCount={virtualSinflarNewCount} />
          </div>

          <div className="shrink-0 border-t border-slate-200/60 p-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
            <form action={logoutStudent} autoComplete="off" suppressHydrationWarning>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200/90 bg-gradient-to-b from-red-50 to-white py-3 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-100/70"
              >
                <LogOut className="h-4 w-4" />
                Chiqish
              </button>
            </form>
          </div>
        </aside>
      ) : null}

      <div className={cn("relative min-h-[100dvh] w-full min-w-0", isLg && "lg:pl-[min(18.5rem,calc(100vw-1.25rem))]")}>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/65 bg-white/75 px-3 py-3 pt-[max(0.6rem,env(safe-area-inset-top))] shadow-sm shadow-indigo-950/[0.04] backdrop-blur-xl lg:hidden">
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/95 bg-white text-slate-800 shadow-sm [touch-action:manipulation] active:bg-slate-50"
            onClick={() => setSheetOpen((o) => !o)}
            aria-expanded={sheetOpen}
            aria-label={sheetOpen ? "Menyuni yopish" : "Menyuni ochish"}
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <GraduationCap className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[12px] font-bold leading-tight text-slate-900">O‘qituvchi</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-indigo-600/90">
                {viloyat}
              </p>
            </div>
          </div>
          <span className="w-11 shrink-0" aria-hidden />
        </header>

        <main
          id="oqituvchi-main"
          className="relative mx-auto min-h-0 w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10"
        >
          {children}
        </main>
      </div>
      {mounted ? mobileLayer : null}
    </div>
  );
}
