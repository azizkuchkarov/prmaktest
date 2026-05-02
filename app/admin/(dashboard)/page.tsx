import Link from "next/link";
import { Newspaper, FileText, ArrowRight, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [newsCount, testCount, publishedNews, publishedTests, userCount, usersNoTelegram] =
    await Promise.all([
      prisma.news.count(),
      prisma.test.count(),
      prisma.news.count({ where: { published: true } }),
      prisma.test.count({ where: { isPublished: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { telegramId: null } }),
    ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Boshqaruv paneli</h1>
        <p className="mt-1 text-slate-600">
          Yangiliklar va testlarni qo&apos;shish yoki tahrirlash.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-5 w-5" aria-hidden />
            <span className="text-sm font-medium">Userlar</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{userCount}</p>
          <p className="text-xs text-slate-500">Telegram yo&apos;q: {usersNoTelegram}</p>
          <Link
            href="/admin/userlar"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ro&apos;yxat <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Newspaper className="h-5 w-5" aria-hidden />
            <span className="text-sm font-medium">Yangiliklar</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{newsCount}</p>
          <p className="text-xs text-slate-500">Nashr etilgan: {publishedNews}</p>
          <Link
            href="/admin/yangiliklar"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Boshqarish <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="h-5 w-5" aria-hidden />
            <span className="text-sm font-medium">Testlar</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{testCount}</p>
          <p className="text-xs text-slate-500">Nashr etilgan: {publishedTests}</p>
          <Link
            href="/admin/testlar"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Boshqarish <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
