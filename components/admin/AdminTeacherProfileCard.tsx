import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronDown, Trash2 } from "lucide-react";
import { approvePendingTeacher } from "@/app/admin/(dashboard)/oqituvchi-tasdiq/actions";
import {
  deleteAdminUser,
  updateUserPassword,
  updateUserTelegram,
} from "@/app/admin/(dashboard)/userlar/actions";
import { AdminListContextFields } from "@/components/admin/AdminListContextFields";
import { formatPhoneDisplay } from "@/lib/phone";

export const adminTeacherListSelect = {
  id: true,
  phone: true,
  firstName: true,
  lastName: true,
  viloyat: true,
  telegramId: true,
  telegramUsername: true,
  createdAt: true,
  appUserRole: true,
  _count: { select: { taughtVirtualClasses: true } },
} as const;

export type AdminTeacherRow = Prisma.UserGetPayload<{ select: typeof adminTeacherListSelect }>;

export function AdminTeacherProfileCard({
  u,
  idx,
  highlightId,
  validViloyat,
  telFilter,
}: {
  u: AdminTeacherRow;
  idx: number;
  highlightId?: string;
  validViloyat?: string;
  telFilter?: string;
}) {
  const missingTg = u.telegramId == null;
  const displayName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "—";
  const isPending = u.appUserRole === "TEACHER_PENDING";
  const vcCount = u._count.taughtVirtualClasses;

  const cardHighlight =
    highlightId === u.id
      ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-white"
      : missingTg
        ? "bg-sky-50/50"
        : "bg-white";

  return (
    <li
      className={`rounded-lg border border-slate-200/90 p-2.5 shadow-sm transition-shadow hover:shadow-md ${cardHighlight}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="text-[10px] font-semibold text-slate-400">#{idx}</span>
            <span className="text-sm font-semibold leading-tight text-slate-900">{displayName}</span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] leading-snug text-slate-700 break-all" title={u.id}>
            {u.id}
          </p>
          <p className="mt-1 text-[10px] leading-snug text-slate-600">
            <span className="text-slate-400">Tel</span> {formatPhoneDisplay(u.phone)}
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-slate-400">Vil</span> {u.viloyat}
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-slate-400">Virtual sinflar</span>{" "}
            <span className="font-semibold text-slate-800">{vcCount}</span>
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {u.telegramUsername ? (
              <span className="font-mono">@{u.telegramUsername}</span>
            ) : (
              <span className="font-mono">@—</span>
            )}
            <span className="mx-1 text-slate-300">·</span>
            {u.createdAt.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-0.5">
          <span
            className={`inline-flex max-w-[14rem] rounded px-1.5 py-0.5 text-center text-[9px] font-bold leading-snug ${
              isPending ? "bg-amber-200 text-amber-950" : "bg-emerald-200 text-emerald-950"
            }`}
          >
            {isPending ? "Admin tasdig'i kutilmoqda" : "Tasdiqlangan o'qituvchi"}
          </span>
          {missingTg ? (
            <span className="inline-flex rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-900">
              TG yo&apos;q
            </span>
          ) : (
            <span className="inline-flex rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900">
              TG bor
            </span>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
          <form action={approvePendingTeacher}>
            <input type="hidden" name="userId" value={u.id} />
            <button
              type="submit"
              className="h-8 rounded-md bg-slate-900 px-3 text-[11px] font-bold text-white hover:bg-slate-800"
            >
              TEACHER qilish (tasdiqlash)
            </button>
          </form>
          <span className="text-[10px] text-slate-500">
            Navbat ko&apos;rinishi:{" "}
            <Link href="/admin/oqituvchi-tasdiq" className="font-semibold text-[#2563EB] underline">
              tasdiq sahifasi
            </Link>
            .
          </span>
        </div>
      ) : null}

      <div className="mt-2 border-t border-slate-100 pt-2">
        <form action={updateUserTelegram.bind(null, u.id)} className="flex min-w-0 flex-wrap items-center gap-1.5">
          <AdminListContextFields vil={validViloyat} tel={telFilter} context="oqituvchilar" />
          <span className="w-[4.25rem] shrink-0 text-[10px] font-medium text-slate-500">Telegram ID</span>
          <input
            name="telegramId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            title="Bo'sh qoldirsangiz Telegram ID o'chadi"
            placeholder="ID"
            defaultValue={u.telegramId != null ? String(u.telegramId) : ""}
            className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-1.5 font-mono text-[11px] text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 sm:max-w-[12rem]"
          />
          <button
            type="submit"
            className="h-8 shrink-0 rounded-md bg-blue-600 px-2 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            Saqlash
          </button>
        </form>
      </div>

      <details className="group/pw mt-2 border-t border-slate-100 pt-1.5">
        <summary className="cursor-pointer list-none text-[10px] font-semibold text-slate-500 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1">
            <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-open/pw:rotate-180" aria-hidden />
            Parol
          </span>
        </summary>
        <form action={updateUserPassword.bind(null, u.id)} className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <AdminListContextFields vil={validViloyat} tel={telFilter} context="oqituvchilar" />
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Yangi"
            minLength={8}
            className="h-8 min-w-[7rem] flex-1 rounded-md border border-slate-200 px-2 text-[11px] text-slate-900 sm:flex-none sm:min-w-[8rem]"
          />
          <input
            name="password2"
            type="password"
            autoComplete="new-password"
            placeholder="Takror"
            minLength={8}
            className="h-8 min-w-[7rem] flex-1 rounded-md border border-slate-200 px-2 text-[11px] text-slate-900 sm:flex-none sm:min-w-[8rem]"
          />
          <button
            type="submit"
            className="h-8 shrink-0 rounded-md border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
          >
            Saqlash
          </button>
        </form>
      </details>

      <details className="group/del mt-2 border-t border-red-100 pt-1.5">
        <summary className="cursor-pointer list-none text-[10px] font-semibold text-red-700 hover:text-red-800 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1">
            <Trash2 className="h-3 w-3 shrink-0" aria-hidden />
            {isPending ? "Akkauntni o'chirish (tasdiqsiz)" : "O'qituvchini o'chirish"}
          </span>
        </summary>
        <form action={deleteAdminUser} className="mt-2 space-y-2 rounded-md border border-red-100 bg-red-50/50 p-2">
          <AdminListContextFields vil={validViloyat} tel={telFilter} context="oqituvchilar" />
          <input type="hidden" name="deleteUserId" value={u.id} />
          <p className="text-[10px] leading-relaxed text-red-950/95">
            O&apos;qituvchi yozuvi o&apos;chsa,{" "}
            <strong>barcha virtual sinflar, biriktirilgan testlar va aʼzolar</strong> bazadan yoʻqoladi (cascade).
          </p>
          <div>
            <label htmlFor={`tq-del-phone-${u.id}`} className="block text-[10px] font-medium text-slate-600">
              Tasdiqlash: akkaunt telefonini yozing (<span className="font-mono">{formatPhoneDisplay(u.phone)}</span>)
            </label>
            <input
              id={`tq-del-phone-${u.id}`}
              name="deletePhoneConfirm"
              type="text"
              inputMode="tel"
              autoComplete="off"
              required
              placeholder="998 XX XXX XX XX"
              className="mt-1 h-8 w-full max-w-[16rem] rounded-md border border-red-200 bg-white px-2 text-[11px] text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/25"
            />
          </div>
          <label className="flex items-start gap-2 text-[10px] text-red-950">
            <input type="checkbox" name="ackDelete" required className="mt-0.5" />
            <span>Tushundim — bu aksiyani qaytarib bo&apos;lmaydi.</span>
          </label>
          <label className="flex items-start gap-2 text-[10px] text-red-950">
            <input type="checkbox" name="ackTeacherCascade" required className="mt-0.5" />
            <span>
              Virtual sinflar va ulardagi yozuvlar ham <strong>birgalikda</strong> yoʻqolanishini tasdiqlayman.
            </span>
          </label>
          <button
            type="submit"
            className="h-8 rounded-md bg-red-600 px-3 text-[11px] font-bold text-white hover:bg-red-700"
          >
            O&apos;chirish
          </button>
        </form>
      </details>
    </li>
  );
}
