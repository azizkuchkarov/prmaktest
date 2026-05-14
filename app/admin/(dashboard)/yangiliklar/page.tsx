import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteNews } from "./actions";

export default async function AdminNewsListPage() {
  const items = await prisma.news.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Yangiliklar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Saytda ko&apos;rinadigan yangiliklar ro&apos;yxati.
            </p>
          </div>
          <Link
            href="/admin/yangiliklar/yangi"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2563EB]/20 transition hover:brightness-105"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Yangi yangilik
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/40">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Sarlavha</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Yangilangan</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Hozircha yangilik yo&apos;q. Birinchi yangilikni qo&apos;shing.
                </td>
              </tr>
            ) : (
              items.map((n) => (
                <tr
                  key={n.id}
                  className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{n.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        n.published
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {n.published ? "Nashr" : "Qoralama"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {n.updatedAt.toLocaleString("uz-UZ", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/yangiliklar/${n.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Tahrirlash
                      </Link>
                      <form action={deleteNews.bind(null, n.id)}>
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
