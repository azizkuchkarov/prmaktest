import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VILOYATLAR, isViloyat } from "@/lib/viloyats";
import { formatPhoneDisplay } from "@/lib/phone";
import { updateUserTelegram } from "./actions";

export const dynamic = "force-dynamic";

type Search = {
  viloyat?: string;
  error?: string;
  id?: string;
  saved?: string;
};

type Props = { searchParams: Promise<Search> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const q = await searchParams;
  const viloyatFilter = typeof q.viloyat === "string" && q.viloyat !== "" ? q.viloyat : undefined;
  const validViloyat = viloyatFilter && isViloyat(viloyatFilter) ? viloyatFilter : undefined;

  const users = await prisma.user.findMany({
    where: validViloyat ? { viloyat: validViloyat } : undefined,
    select: {
      id: true,
      phone: true,
      viloyat: true,
      telegramId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  users.sort((a, b) => {
    const aLinked = a.telegramId != null;
    const bLinked = b.telegramId != null;
    if (aLinked !== bLinked) return aLinked ? 1 : -1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const error = typeof q.error === "string" ? q.error : undefined;
  const highlightId = typeof q.id === "string" ? q.id : undefined;
  const saved = q.saved === "1";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Userlar</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Ro&apos;yxatdan o&apos;tgan o&apos;quvchilar. Bu yerda siz ularning{" "}
          <span className="font-medium text-slate-800">Telegram ID</span> sini qo&apos;lda
          kiritishingiz yoki tahrirlashingiz mumkin — yangilik va test xabarlarini bot orqali
          yuborish uchun kerak bo&apos;ladi.{" "}
          <span className="font-medium text-slate-800">
            Telegram ID bo&apos;lmagan foydalanuvchilar yuqorida
          </span>{" "}
          (1-turdagi kabi) ko&apos;rsatiladi.
        </p>
      </div>

      {saved ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          O&apos;zgarishlar saqlandi.
        </p>
      ) : null}
      {error === "invalid" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Telegram ID faqat raqamlardan iborat bo&apos;lishi va uzunligi mos kelishi kerak (5–20
          belgi).
        </p>
      ) : null}
      {error === "duplicate" ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Bu Telegram ID boshqa foydalanuvchida allaqachon band.
        </p>
      ) : null}
      {error === "save" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Saqlashda xatolik. Qayta urinib ko&apos;ring.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="viloyat" className="block text-xs font-medium text-slate-500">
              Viloyat bo&apos;yicha
            </label>
            <select
              id="viloyat"
              name="viloyat"
              defaultValue={validViloyat ?? ""}
              className="mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Barcha viloyatlar</option>
              {VILOYATLAR.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Filtrlash
          </button>
        </form>
        {validViloyat ? (
          <Link
            href="/admin/userlar"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Filtrni tozalash
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <Users className="h-5 w-5 text-slate-500" aria-hidden />
          <span className="text-sm font-semibold text-slate-800">
            Jami: {users.length}{" "}
            {validViloyat ? <span className="font-normal text-slate-500">({validViloyat})</span> : null}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Viloyat</th>
                <th className="px-4 py-3">Telegram ID</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Ro&apos;yxatdan</th>
                <th className="px-4 py-3 text-right">Holat</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Foydalanuvchilar yo&apos;q yoki filtr bo&apos;yicha natija topilmadi.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const missingTg = u.telegramId == null;
                  const rowHighlight =
                    highlightId === u.id
                      ? "bg-amber-50/80 ring-1 ring-inset ring-amber-200"
                      : missingTg
                        ? "bg-sky-50/40"
                        : "";
                  return (
                    <tr key={u.id} className={`border-b border-slate-50 last:border-0 ${rowHighlight}`}>
                      <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatPhoneDisplay(u.phone)}
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-slate-700">{u.viloyat}</td>
                      <td className="px-4 py-3 align-top">
                        <form
                          action={updateUserTelegram.bind(null, u.id)}
                          className="flex flex-wrap items-center gap-2"
                        >
                          {validViloyat ? (
                            <input type="hidden" name="redirectViloyat" value={validViloyat} />
                          ) : null}
                          <input
                            name="telegramId"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={"Bo'sh — Telegram ID o'chiriladi"}
                            defaultValue={u.telegramId != null ? String(u.telegramId) : ""}
                            className="w-44 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Saqlash
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {u.telegramUsername ? `@${u.telegramUsername}` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {u.createdAt.toLocaleString("uz-UZ", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {missingTg ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                            Telegram yo&apos;q
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
                            Ulangan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
