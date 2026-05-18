import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewsStatusBadge } from "@/components/news/NewsStatusBadge";
import { getNewsReadIdSet } from "@/lib/news-read";
import { getCurrentStudent } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Yangiliklar — Prezident Test",
  description: "Prezident maktabi tayyorgarligi bo'yicha yangiliklar.",
};

type PageProps = { searchParams: Promise<{ from?: string }> };

export default async function NewsPublicPage({ searchParams }: PageProps) {
  const q = await searchParams;
  const fromKabinet = q.from === "kabinet";
  const items = await prisma.news.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
  });

  const student = await getCurrentStudent();
  const readIds =
    student && items.length > 0
      ? await getNewsReadIdSet(
          student.id,
          items.map((n) => n.id),
        )
      : new Set<string>();

  const itemQuery = fromKabinet ? "?from=kabinet" : "";

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-gradient-to-b from-sky-50/80 via-white to-indigo-50/30">
      <header className="border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 pad-x-page sm:h-16">
          <Link
            href={fromKabinet ? "/kabinet" : "/"}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg py-1 font-semibold text-slate-900 hover:bg-slate-50 active:bg-slate-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
              <Newspaper className="h-5 w-5" aria-hidden />
            </span>
            <span className="truncate">Yangiliklar</span>
          </Link>
          <Link
            href={fromKabinet ? "/kabinet" : "/"}
            className="flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-blue-600 hover:bg-sky-50 hover:text-blue-700 active:bg-sky-100"
          >
            {fromKabinet ? "Kabinetga qaytish" : "Bosh sahifa"}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl pad-x-page py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-14">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Yangiliklar</h1>
        <p className="mt-2 text-slate-600">
          Platforma va imtihonlar haqida rasmiy yangilanishlar.
        </p>
        <ul className="mt-10 space-y-4">
          {items.length === 0 ? (
            <li className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500 shadow-sm">
              Hozircha yangiliklar yo&apos;q.
            </li>
          ) : (
            items.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/yangiliklar/${n.id}${itemQuery}`}
                  className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/40 transition hover:border-blue-100 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="min-w-0 flex-1 text-lg font-semibold text-slate-900">{n.title}</h2>
                    {student ? <NewsStatusBadge isRead={readIds.has(n.id)} className="mt-0.5" /> : null}
                  </div>
                  {n.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{n.excerpt}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-slate-400">
                    {n.updatedAt.toLocaleString("uz-UZ", {
                      dateStyle: "medium",
                    })}
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}
