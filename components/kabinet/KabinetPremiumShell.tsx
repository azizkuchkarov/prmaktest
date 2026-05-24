"use client";

import { startTransition, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  GitBranch,
  Headphones,
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
import { KabinetSupportModalForm } from "@/components/kabinet/KabinetSupportModalForm";
import { useKabinetStudyGuide } from "@/components/kabinet/KabinetStudyGuide";
import { cn } from "@/lib/utils";

const nav = [
  { href: "#bosh", label: "Boshqaruv", icon: LayoutDashboard },
  { href: "#reyting", label: "Reyting", icon: Trophy },
  { href: "#tayyorgarlik", label: "Tayyorgarlik", icon: Target },
  { href: "#diagrammalar", label: "Diagrammalar", icon: BarChart3 },
  { href: "#testlar", label: "Katalog", icon: BookOpen },
  { href: "#turnirlar", label: "Turnirlar", icon: Trophy },
  { href: "#liderlar", label: "Liderlar", icon: Award },
  { href: "#roadmap", label: "Roadmap", icon: GitBranch },
  { href: "#yangiliklar", label: "Yangiliklar", icon: Newspaper },
  { href: "#profil", label: "Profil", icon: User },
] as const;

type Props = {
  displayName: string;
  viloyat: string;
  supportConfigured: boolean;
  children: React.ReactNode;
};

function NavLinks({
  onNavigate,
  supportConfigured,
  onOpenSupport,
}: {
  onNavigate?: () => void;
  supportConfigured?: boolean;
  onOpenSupport?: () => void;
}) {
  const linkClass = cn(
    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700",
    "transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-500/[0.08] hover:to-violet-500/[0.08] hover:text-[#1d4ed8] hover:shadow-sm hover:ring-1 hover:ring-slate-200/60 active:scale-[0.99]",
  );
  const iconWrapClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-[#2563EB] shadow-inner ring-1 ring-white/80";

  return (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Asosiy menyu">
      {nav.map(({ href, label, icon: Icon }) => (
        <a key={href} href={href} onClick={() => onNavigate?.()} className={linkClass}>
          <span className={iconWrapClass}>
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="min-w-0 break-words">{label}</span>
        </a>
      ))}
      {supportConfigured && onOpenSupport ? (
        <button
          type="button"
          className={cn(
            linkClass,
            "w-full text-left hover:from-teal-500/[0.09] hover:to-violet-500/[0.1] hover:text-violet-800",
          )}
          onClick={() => {
            onOpenSupport();
            onNavigate?.();
          }}
        >
          <span
            className={cn(
              iconWrapClass,
              "from-teal-50 to-violet-50 text-violet-600",
            )}
          >
            <Headphones className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="min-w-0 text-left break-words">
            <span className="block">24/7 yordam</span>
            <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
              Texnik qo&apos;llab-quvvatlash
            </span>
          </span>
        </button>
      ) : null}
    </nav>
  );
}

export function KabinetPremiumShell({
  displayName,
  viloyat,
  supportConfigured,
  children,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportModalNonce, setSupportModalNonce] = useState(0);
  const [mounted, setMounted] = useState(false);
  /** Start narrow so desktop aside is not mounted until `matchMedia` runs (avoids ghost overlap on mobile). */
  const [isLg, setIsLg] = useState(false);

  const { openStudyGuide } = useKabinetStudyGuide();

  useEffect(() => setMounted(true), []);

  const openSupportModal = () => {
    setSupportModalNonce((n) => n + 1);
    setSupportOpen(true);
  };

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
                "fixed inset-y-0 left-0 z-[10060] flex h-[100dvh] w-[min(18.5rem,calc(100vw-1rem))] flex-col border-r border-white/80 bg-white/90 shadow-2xl shadow-slate-900/20 backdrop-blur-xl lg:hidden",
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
                <NavLinks
                  onNavigate={() => setSheetOpen(false)}
                  supportConfigured={supportConfigured}
                  onOpenSupport={openSupportModal}
                />
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
    "fixed left-0 top-0 z-40 flex h-[100dvh] w-[min(18rem,calc(100vw-1.5rem))] shrink-0 flex-col border-r border-white/80 bg-white/75 shadow-2xl shadow-slate-900/10 backdrop-blur-xl",
    "transition-[transform,opacity] duration-300 ease-out"
  );

  return (
    <div
      data-kabinet-shell
      className="min-h-[100dvh] w-full min-w-0 max-w-full overflow-x-clip bg-gradient-to-b from-slate-100/95 via-[#f4f7fc] to-slate-100 text-slate-900"
    >
      {isLg ? (
        <aside className={asideClass} aria-label="Kabinet navigatsiyasi">
          <div className="border-b border-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
              Prezident maktabi
            </p>
            <p className="mt-2 truncate text-lg font-bold tracking-tight text-slate-900">Kabinet</p>
            <p className="truncate text-xs font-medium text-slate-500">{shortName}</p>
            <p className="mt-1.5 inline-flex truncate rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
              {viloyat}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-2">
            <NavLinks supportConfigured={supportConfigured} onOpenSupport={openSupportModal} />
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
          "relative z-10 w-full min-w-0 max-w-full",
          isLg && "pl-[min(18rem,calc(100dvw-1.5rem))]"
        )}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/70 bg-gradient-to-b from-white/90 to-slate-50/80 px-3 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm shadow-slate-900/5 backdrop-blur-xl lg:hidden">
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
            "pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-[max(2rem,env(safe-area-inset-bottom))]",
          )}
        >
          {children}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 box-border border-t border-white/80 bg-gradient-to-t from-white/95 via-slate-50/90 to-white/80 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] shadow-[0_-12px_40px_-16px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => openStudyGuide()}
            className="box-border flex h-14 min-h-[3.5rem] w-full max-w-full min-w-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] via-[#4f46e5] to-[#7C3AED] px-4 text-base font-bold leading-tight text-white shadow-xl shadow-blue-500/30 ring-1 ring-white/25 outline-none transition [touch-action:manipulation] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 active:brightness-95 sm:h-14"
          >
            Test haqida
          </button>
        </div>
      </div>
      {mounted && supportOpen && supportConfigured
        ? createPortal(
            <KabinetSupportModalForm key={supportModalNonce} onClose={() => setSupportOpen(false)} />,
            document.body,
          )
        : null}
      {mobileMenuLayer}
    </div>
  );
}
