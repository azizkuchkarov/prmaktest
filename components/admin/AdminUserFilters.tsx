"use client";

import Link from "next/link";

type Props = {
  defaultViloyat: string;
  defaultTel: string;
  viloyatOptions: readonly string[];
  hasActiveFilter: boolean;
  filterClearHref: string;
  /** Telefon maydon izohi (masalan userlar/O'qituvchilar) */
  telFieldLabel?: string;
};

/**
 * Viloyat tanlanganda form avtomatik yuboriladi — URL da `?viloyat=...` bo‘lmasa server barcha userlarni beradi.
 */
export function AdminUserFilters({
  defaultViloyat,
  defaultTel,
  viloyatOptions,
  hasActiveFilter,
  filterClearHref,
  telFieldLabel = "O'quvchi telefoni",
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-end">
      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label htmlFor="viloyat" className="block text-xs font-medium text-slate-500">
            Viloyat
          </label>
          <select
            id="viloyat"
            name="viloyat"
            defaultValue={defaultViloyat}
            onChange={(e) => {
              e.currentTarget.form?.requestSubmit();
            }}
            className="mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Barcha viloyatlar</option>
            {viloyatOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tel" className="block text-xs font-medium text-slate-500">
            {telFieldLabel}
          </label>
          <input
            id="tel"
            name="tel"
            type="text"
            defaultValue={defaultTel}
            placeholder="+998 yoki qisman raqam"
            className="mt-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-110"
        >
          Qidirish
        </button>
      </form>
      {hasActiveFilter ? (
        <Link href={filterClearHref} className="text-sm font-semibold text-[#2563EB] hover:text-violet-700">
          Filtrlarni tozalash
        </Link>
      ) : null}
    </div>
  );
}
