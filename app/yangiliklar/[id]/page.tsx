import Link from "next/link";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const news = await prisma.news.findFirst({
    where: { id, published: true },
    select: { title: true },
  });
  if (!news) return { title: "Yangilik topilmadi" };
  return { title: `${news.title} — Prezident Test` };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const news = await prisma.news.findFirst({
    where: { id, published: true },
  });
  if (!news) notFound();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50/80 via-white to-indigo-50/30">
      <header className="border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
          <Link
            href="/yangiliklar"
            className="flex min-h-11 min-w-0 max-w-[65%] items-center gap-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-sky-50 hover:text-blue-700 active:bg-sky-100 sm:max-w-none"
          >
            <Newspaper className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Barcha yangiliklar</span>
          </Link>
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
          >
            Bosh sahifa
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-3 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-14">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {news.title}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {news.updatedAt.toLocaleString("uz-UZ", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        {news.excerpt ? (
          <p className="mt-6 text-lg text-slate-700">{news.excerpt}</p>
        ) : null}
        <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap text-slate-800">
          {news.body || "—"}
        </div>
      </article>
    </div>
  );
}
