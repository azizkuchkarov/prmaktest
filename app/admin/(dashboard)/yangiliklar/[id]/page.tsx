import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewsFormEdit } from "../news-form";

type Props = { params: Promise<{ id: string }> };

export default async function AdminNewsEditPage({ params }: Props) {
  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/yangiliklar"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Ro&apos;yxatga qaytish
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Yangilikni tahrirlash</h1>
        <p className="mt-1 text-slate-600">{news.title}</p>
      </div>
      <NewsFormEdit news={news} />
    </div>
  );
}
