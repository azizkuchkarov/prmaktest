import Link from "next/link";
import { ArrowRight, BookUser, FileText, Headphones, Newspaper, Sparkles, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [
    newsCount,
    testCount,
    publishedNews,
    publishedTests,
    studentCount,
    studentsNoTelegram,
    teacherApprovedCount,
    teacherPendingCount,
    depositCompletedCount,
  ] = await Promise.all([
    prisma.news.count(),
    prisma.test.count(),
    prisma.news.count({ where: { published: true } }),
    prisma.test.count({ where: { isPublished: true } }),
    prisma.user.count({ where: { appUserRole: "STUDENT" } }),
    prisma.user.count({ where: { appUserRole: "STUDENT", telegramId: null } }),
    prisma.user.count({ where: { appUserRole: "TEACHER" } }),
    prisma.user.count({ where: { appUserRole: "TEACHER_PENDING" } }),
    prisma.balanceDeposit.count({ where: { status: "COMPLETED" } }),
  ]);

  const teacherRosterTotal = teacherApprovedCount + teacherPendingCount;

  const cards = [
    {
      href: "/admin/userlar",
      label: "Userlar",
      sublabel: "Faqat o'quvchilar",
      value: studentCount,
      hint: `Telegram yo'q: ${studentsNoTelegram}`,
      icon: Users,
      accent: "from-sky-500 to-blue-600",
    },
    {
      href: "/admin/oqituvchilar",
      label: "O'qituvchilar",
      sublabel: "Profillar",
      value: teacherRosterTotal,
      hint: `Tasdiqlangan ${teacherApprovedCount} · kutilyapti ${teacherPendingCount}`,
      icon: BookUser,
      accent: "from-indigo-500 to-violet-600",
    },
    {
      href: "/admin/tolovlar",
      label: "To'lovlar",
      value: depositCompletedCount,
      hint: "Yakunlangan CLICK depozitlari",
      icon: Wallet,
      accent: "from-emerald-500 to-teal-600",
    },
    {
      href: "/admin/yangiliklar",
      label: "Yangiliklar",
      value: newsCount,
      hint: `Nashr etilgan: ${publishedNews}`,
      icon: Newspaper,
      accent: "from-violet-500 to-purple-600",
    },
    {
      href: "/admin/testlar",
      label: "Testlar",
      value: testCount,
      hint: `Nashr etilgan: ${publishedTests}`,
      icon: FileText,
      accent: "from-emerald-500 to-teal-600",
    },
    {
      href: "/admin/sozlamalar",
      label: "Kabinet 24/7",
      value: "24/7",
      hint: "Yordam: Telegram chat ID",
      icon: Headphones,
      accent: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Boshqaruv
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Boshqaruv paneli
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              Yangiliklar, testlar va foydalanuvchilarni bir joydan boshqaring. Quyidagi kartochkalardan
              tez oʻting.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ href, label, sublabel, value, hint, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/40 transition hover:border-violet-200/80 hover:shadow-lg hover:shadow-violet-500/10"
          >
            <div
              className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${accent} p-2.5 text-white shadow-md`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            {sublabel ? (
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-violet-600/90">{sublabel}</p>
            ) : null}
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#2563EB] transition group-hover:gap-2">
              Boshqarish
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
