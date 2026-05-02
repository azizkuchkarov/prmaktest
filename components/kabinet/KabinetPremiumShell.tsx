"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
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
} from "lucide-react";
import { logoutStudent } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (sheetOpen && isDesktop) startTransition(() => setSheetOpen(false));
  }, [isDesktop, sheetOpen]);

  const shortName = displayName.split(" ").filter(Boolean)[0] || "O'quvchi";

  const asideClass = cn(
    "fixed left-0 top-0 z-40 flex h-[100dvh] w-[min(18rem,calc(100vw-1.5rem))] shrink-0 flex-col border-r border-white/60 bg-white shadow-xl shadow-slate-200/40",
    "transition-[transform,opacity,visibility] duration-300 ease-out",
    "max-lg:pointer-events-none max-lg:invisible max-lg:opacity-0 max-lg:-translate-x-full",
    "lg:pointer-events-auto lg:visible lg:opacity-100 lg:translate-x-0"
  );

  return (
    <div className="min-h-[100dvh] w-full min-w-0 max-w-[100vw] overflow-x-clip bg-[#F8FAFC] text-slate-900">
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
          <form action={logoutStudent}>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} modal>
        <SheetContent side="left" showCloseButton className="w-[min(18.5rem,calc(100vw-1rem))] border-white/60 bg-white p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-slate-100 px-4 py-4 text-left">
            <SheetTitle className="text-base">Menyu</SheetTitle>
            <SheetDescription className="text-xs">
              {shortName} · {viloyat}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pb-8">
            <NavLinks onNavigate={() => setSheetOpen(false)} />
            <div className="px-3 pt-4">
              <form action={logoutStudent}>
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
        </SheetContent>
      </Sheet>

      <div className="relative z-10 w-full min-w-0 max-w-[100vw] lg:pl-[min(18rem,calc(100dvw-1.5rem))]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/60 bg-[#F8FAFC]/90 px-3 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-2xl border-slate-200/90 bg-white shadow-sm"
            onClick={() => setSheetOpen(true)}
            aria-label="Menyuni ochish"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
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

        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-[#F8FAFC]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.15)] backdrop-blur-md lg:hidden">
          <Link
            href={ctaHref}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-base font-bold text-white shadow-lg shadow-[#2563EB]/25 outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 active:brightness-95"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
