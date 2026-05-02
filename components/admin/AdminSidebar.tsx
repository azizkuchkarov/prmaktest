import Link from "next/link";
import { FileText, LayoutDashboard, LogOut, Newspaper, Users } from "lucide-react";
import { adminLogout } from "@/app/admin/login/actions";

const links = [
  { href: "/admin", label: "Boshqaruv", icon: LayoutDashboard },
  { href: "/admin/userlar", label: "Userlar", icon: Users },
  { href: "/admin/yangiliklar", label: "Yangiliklar", icon: Newspaper },
  { href: "/admin/testlar", label: "Testlar", icon: FileText },
] as const;

export function AdminSidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <Link href="/admin" className="font-semibold text-slate-900">
          Admin panel
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">Prezident Test</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Admin menyu">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <form action={adminLogout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Chiqish
          </button>
        </form>
      </div>
      <div className="border-t border-slate-100 px-4 py-3">
        <Link
          href="/"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Saytga qaytish
        </Link>
      </div>
    </aside>
  );
}
