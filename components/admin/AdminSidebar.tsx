"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Shield,
  Users,
  Wallet,
  Trophy,
} from "lucide-react";
import { adminLogout } from "@/app/admin/login/actions";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Boshqaruv", icon: LayoutDashboard },
  { href: "/admin/userlar", label: "Userlar", icon: Users },
  { href: "/admin/tolovlar", label: "To'lovlar", icon: Wallet },
  { href: "/admin/yangiliklar", label: "Yangiliklar", icon: Newspaper },
  { href: "/admin/testlar", label: "Testlar", icon: FileText },
  { href: "/admin/turnirlar", label: "Turnirlar", icon: Trophy },
  { href: "/admin/sozlamalar", label: "Kabinet yordam", icon: Headphones },
] as const;

function linkActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname() || "";

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-slate-200/80 bg-white/95 backdrop-blur-md",
        "sticky top-0 z-40 border-b shadow-sm shadow-slate-200/40",
        "lg:static lg:z-auto lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:shadow-none"
      )}
    >
      <div className="border-b border-slate-100 px-4 py-4 lg:px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-md shadow-violet-500/25">
            <Shield className="size-[22px]" aria-hidden />
          </div>
          <div className="min-w-0">
            <Link
              href="/admin"
              className="block truncate font-bold tracking-tight text-slate-900 transition hover:text-violet-800"
            >
              Admin panel
            </Link>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-600/90">
              Prezident maktabi
            </p>
          </div>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-1 lg:flex-col lg:gap-0.5 lg:p-3 lg:pt-2"
        aria-label="Admin menyu"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active = linkActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                "lg:w-full",
                active
                  ? "bg-gradient-to-r from-[#2563EB]/12 to-[#7C3AED]/12 text-violet-950 ring-1 ring-[#7C3AED]/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[#2563EB]" : "text-slate-400"
                )}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0 border-t border-slate-100 lg:border-t">
        <form action={adminLogout} className="p-2 lg:p-3 lg:pt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/80 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 lg:justify-start"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Chiqish
          </button>
        </form>
        <div className="border-t border-slate-100 px-3 pb-3 pt-0 lg:px-4 lg:pb-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#2563EB] transition hover:text-violet-700 lg:justify-start"
          >
            Saytga qaytish
            <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
          </Link>
        </div>
      </div>
    </aside>
  );
}
