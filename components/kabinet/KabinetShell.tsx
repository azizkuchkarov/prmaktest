"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  GitBranch,
  Home,
  LayoutDashboard,
  LogOut,
  Newspaper,
  PanelLeft,
  Trophy,
  User,
  X,
} from "lucide-react";
import { logoutStudent } from "@/app/auth/actions";

type Props = {
  displayName: string;
  viloyat: string;
  children: React.ReactNode;
};

const nav = [
  { href: "#bosh", label: "Boshqaruv", icon: LayoutDashboard },
  { href: "#yangiliklar", label: "Yangiliklar", icon: Newspaper },
  { href: "#roadmap", label: "Roadmap", icon: GitBranch },
  { href: "#reyting", label: "Reyting", icon: Trophy },
  { href: "#testlar", label: "Katalog", icon: BookOpen },
  { href: "#profil", label: "Profil", icon: User },
] as const;

export function KabinetShell({ displayName, viloyat, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const lock = open && !isDesktop;
    if (lock) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isDesktop]);

  const shortName = displayName.split(" ").filter(Boolean)[0] || "O'quvchi";

  return (
    <div className="min-h-[100dvh] w-full min-w-0 bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-slate-200/90 bg-white/95 px-3 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm active:bg-slate-50 [touch-action:manipulation]"
          aria-label="Menyuni ochish"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold text-slate-900">Kabinet</p>
          <p className="truncate text-[10px] font-medium text-teal-700">{viloyat}</p>
        </div>
        <span className="w-11 shrink-0" aria-hidden />
      </header>

      <button
        type="button"
        aria-label="Menyuni yopish"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="kabinet-drawer"
        aria-hidden={!isDesktop && !open}
        className={[
          "fixed left-0 top-0 z-[60] flex h-[100dvh] w-72 max-w-[min(18rem,calc(100vw-1.5rem))] shrink-0 flex-col border-r border-slate-200/90",
          "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 shadow-2xl",
          "transition-[transform,opacity,visibility] duration-300 ease-out will-change-transform",
          /* Desktop: doim ko‘rinadi */
          "lg:translate-x-0 lg:opacity-100 lg:visible lg:pointer-events-auto",
          /* Mobil: faqat ochilganda */
          open
            ? "max-lg:translate-x-0 max-lg:opacity-100 max-lg:visible max-lg:pointer-events-auto"
            : "max-lg:-translate-x-full max-lg:opacity-0 max-lg:invisible max-lg:pointer-events-none",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] lg:pt-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400/90">Tayyorgarlik</p>
            <p className="truncate text-lg font-bold tracking-tight text-white">Kabinet</p>
            <p className="truncate text-xs text-slate-400">{shortName}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white lg:hidden [touch-action:manipulation]"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4 overscroll-contain"
          aria-label="Asosiy menyu"
        >
          {nav.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white active:bg-white/15 [touch-action:manipulation]"
            >
              <Icon className="h-5 w-5 shrink-0 text-teal-400" aria-hidden />
              <span className="min-w-0 whitespace-normal break-words">{label}</span>
            </a>
          ))}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mt-4 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white [touch-action:manipulation]"
          >
            <Home className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0">Bosh sahifa</span>
          </Link>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form action={logoutStudent}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/25 [touch-action:manipulation]"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Chiqish
            </button>
          </form>
        </div>
      </aside>

      <div className="relative z-10 w-full min-w-0 max-w-full bg-slate-50 pl-0 lg:pl-72">
        <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}
