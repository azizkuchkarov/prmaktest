import { GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPhoneDisplay } from "@/lib/phone";
import { approvePendingTeacher } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminOqituvchiTasdiqPage() {
  const rows = await prisma.user.findMany({
    where: { appUserRole: "TEACHER_PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      viloyat: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-teal-500 text-white shadow-md">
          <GraduationCap className="size-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">O‘qituvchi tasdig‘i</h1>
          <p className="text-sm text-slate-600">
            Yangi oʻqituvchi roʻyxatdan oʻtganda Telegram ga xabar ketadi — bu yerda akkauntni{" "}
            <span className="font-medium text-slate-800">TEACHER</span> qilib tasdiqlang.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Hozircha kutilayotgan oʻqituvchilar yoʻq.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-slate-900">
                  {[r.firstName, r.lastName].filter(Boolean).join(" ").trim() || "—"}
                </p>
                <p className="font-medium text-slate-700">{formatPhoneDisplay(r.phone)}</p>
                <p className="text-slate-600">{r.viloyat}</p>
                <p className="truncate font-mono text-xs text-slate-400">{r.id}</p>
                <p className="text-xs text-slate-400">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</p>
              </div>
              <form action={approvePendingTeacher} className="shrink-0">
                <input type="hidden" name="userId" value={r.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Tasdiqlash
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
