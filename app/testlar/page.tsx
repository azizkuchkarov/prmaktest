import Link from "next/link";
import { Clock, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Testlar — Prezident Test",
  description: "Nashr etilgan testlar ro'yxati.",
};

export default async function TestsPublicPage() {
  const items = await prisma.test.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-sky-50/80 via-white to-teal-50/20">
      <header className="w-full min-w-0 overflow-x-hidden border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex h-14 w-full min-w-0 max-w-5xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg py-1 font-semibold text-slate-900 hover:bg-slate-50 active:bg-slate-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
            <span className="truncate">Testlar</span>
          </Link>
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-blue-600 hover:bg-sky-50 hover:text-blue-700 active:bg-sky-100"
          >
            Bosh sahifa
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-14">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Testlar katalogi</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Nashr etilgan testlar. Kartani ochib batafsil ma&apos;lumotni ko&apos;ring; yechish
          rejasi tez orada ulanadi.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Ro&apos;yxatdan o&apos;tgan o&apos;quvchilar testlarni{" "}
          <Link href="/kabinet" className="font-medium text-blue-600 hover:text-blue-700">
            shaxsiy kabinet
          </Link>{" "}
          orqali ham kuzatadi.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {items.length === 0 ? (
            <li className="col-span-full rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500 shadow-sm">
              Hozircha nashr etilgan testlar yo&apos;q.
            </li>
          ) : (
            items.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/testlar/${t.id}`}
                  className="block h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/40 transition hover:border-blue-200 hover:shadow-lg"
                >
                  <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
                  {t.subject ? (
                    <p className="mt-1 text-sm font-medium text-teal-700">{t.subject}</p>
                  ) : null}
                  {t.description ? (
                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">{t.description}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 font-medium text-slate-700">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {t.durationMinutes} daqiqa
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-800">
                      {t._count.questions} savol
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-blue-600">Batafsil →</p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}
