import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentStudent } from "@/lib/student-auth";
import { logoutStudent } from "@/app/auth/actions";
import { formatPhoneDisplay } from "@/lib/phone";

const nav = [
  { href: "#afzalliklar", label: "Afzalliklar" },
  { href: "#qanday-ishlaydi", label: "Qanday ishlaydi" },
  { href: "#reyting", label: "Reyting" },
  { href: "#ota-ona", label: "Ota-ona" },
  { href: "#fanlar", label: "Fanlar" },
  { href: "/yangiliklar", label: "Yangiliklar" },
  { href: "/testlar", label: "Testlar" },
] as const;

export async function LandingHeader() {
  const student = await getCurrentStudent();

  const navLinks = nav.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
    >
      {item.label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 overflow-x-hidden border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-md [-webkit-tap-highlight-color:transparent]">
      <div className="mx-auto w-full min-w-0 max-w-6xl pad-x-page">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
          <Link
            href="/#hero"
            className="flex min-h-11 min-w-0 shrink items-center gap-2 rounded-lg py-1 font-semibold tracking-tight text-slate-900 hover:bg-slate-50 active:bg-slate-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-md shadow-blue-500/25">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </span>
            <span className="hidden min-w-0 truncate sm:inline">Prezident Test</span>
            <span className="truncate sm:hidden">PT</span>
          </Link>
          <nav
            className="scrollbar-touch hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto md:flex"
            aria-label="Asosiy navigatsiya"
          >
            {navLinks}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {student ? (
              <>
                <Link
                  href="/kabinet"
                  className="max-w-[120px] truncate rounded-lg px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 sm:max-w-[180px] sm:text-sm"
                  title={formatPhoneDisplay(student.phone)}
                >
                  Kabinet
                </Link>
                <form action={logoutStudent}>
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50 active:bg-red-100 sm:text-sm"
                  >
                    Chiqish
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/auth/kirish"
                  className="min-h-11 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 sm:px-3 sm:text-sm"
                >
                  Kirish
                </Link>
                <Link
                  href="/auth/royxatdan-otish"
                  className="inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-blue-600 to-teal-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 active:brightness-95 sm:px-4 sm:text-sm"
                >
                  Ro&apos;yxat
                </Link>
              </>
            )}
          </div>
        </div>
        <nav
          className="scrollbar-touch -mx-3 flex gap-0.5 overflow-x-auto border-t border-slate-100 px-2 py-2 md:hidden"
          aria-label="Asosiy navigatsiya"
        >
          {navLinks}
        </nav>
      </div>
    </header>
  );
}
