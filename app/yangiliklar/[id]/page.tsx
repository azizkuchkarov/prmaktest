import Link from "next/link";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProseLongform } from "@/components/content/ProseLongform";
import { NewsStatusBadge } from "@/components/news/NewsStatusBadge";
import { getCurrentStudent } from "@/lib/student-auth";
import { markNewsAsRead } from "@/lib/news-read";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await prisma.news.findFirst({
    where: { id, published: true },
    select: { title: true },
  });
  if (!news) return { title: "Yangilik topilmadi" };
  return { title: `${news.title} — Prezident Test` };
}

export default async function NewsDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const q = await searchParams;
  const fromKabinet = q.from === "kabinet";
  const news = await prisma.news.findFirst({
    where: { id, published: true },
  });
  if (!news) notFound();

  const student = await getCurrentStudent();
  if (student) {
    await markNewsAsRead(student.id, news.id);
  }

  const listHref = fromKabinet ? "/yangiliklar?from=kabinet" : "/yangiliklar";
  const secondaryHref = fromKabinet ? "/kabinet" : "/";
  const secondaryLabel = fromKabinet ? "Kabinetga qaytish" : "Bosh sahifa";

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-gradient-to-b from-sky-50/80 via-white to-indigo-50/30">
      <header className="border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center justify-between gap-2 pad-x-page sm:h-16">
          <Link
            href={listHref}
            className="flex min-h-11 min-w-0 max-w-[65%] items-center gap-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-sky-50 hover:text-blue-700 active:bg-sky-100 sm:max-w-none"
          >
            <Newspaper className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Barcha yangiliklar</span>
          </Link>
          <Link
            href={secondaryHref}
            className="flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
          >
            {secondaryLabel}
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl pad-x-page py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {news.title}
          </h1>
          {student ? <NewsStatusBadge isRead className="sm:mt-2" /> : null}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {news.updatedAt.toLocaleString("uz-UZ", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        {news.excerpt ? (
          <p className="mt-6 text-lg font-medium leading-relaxed text-slate-800 sm:text-xl">{news.excerpt}</p>
        ) : null}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm ring-1 ring-slate-100/80 sm:p-8">
          {news.body ? (
            <ProseLongform text={news.body} />
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </div>
      </article>
    </div>
  );
}
