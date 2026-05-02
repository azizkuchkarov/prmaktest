import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteTest } from "./actions";

export default async function AdminTestsListPage() {
  const items = await prisma.test.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testlar</h1>
          <p className="mt-1 text-slate-600">
            Saralash testlari: savollar, variantlar va yechimlar admin orqali to&apos;ldiriladi.
          </p>
        </div>
        <Link
          href="/admin/testlar/yangi"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Yangi test
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Nomi</th>
              <th className="px-4 py-3">Fan</th>
              <th className="px-4 py-3">Vaqt</th>
              <th className="px-4 py-3">Savollar</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Hozircha test yo&apos;q. Birinchi testni qo&apos;shing.
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600">{t.subject || "—"}</td>
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
