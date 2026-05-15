import Link from "next/link";
import { Plus, Pencil, Banknote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteTest } from "./actions";
import { formatPriceSum } from "@/lib/format-uzs";
import { CATALOG_LABEL_ADMIN } from "@/lib/test-catalog";

export default async function AdminTestsListPage() {
  const items = await prisma.test.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Testlar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Saralash testlari: savollar, variantlar va yechimlar admin orqali to&apos;ldiriladi.
            </p>
          </div>
          <Link
            href="/admin/testlar/yangi"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2563EB]/20 transition hover:brightness-105"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Yangi test
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/40">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Nomi</th>
              <th className="px-4 py-3">Katalog</th>
              <th className="px-4 py-3">Fan</th>
              <th className="px-4 py-3">Narx</th>
              <th className="px-4 py-3">Vaqt</th>
              <th className="px-4 py-3">Savollar</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  Hozircha test yo&apos;q. Birinchi testni qo&apos;shing.
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{t.title}</td>
                  <td className="px-4 py-3 text-slate-700">{CATALOG_LABEL_ADMIN[t.catalogCategory]}</td>
                  <td className="px-4 py-3 text-slate-600">{t.subject || "—"}</td>
                  <td className="px-4 py-3">
                    {t.priceSum > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                        <Banknote className="h-3 w-3" aria-hidden />
                        {formatPriceSum(t.priceSum)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Bepul</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.durationMinutes} daq.</td>
                  <td className="px-4 py-3 text-slate-700">{t._count.questions}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        t.isPublished
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {t.isPublished ? "Nashr" : "Qoralama"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/testlar/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Tahrirlash
                      </Link>
                      <form action={deleteTest.bind(null, t.id)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          O&apos;chirish
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
