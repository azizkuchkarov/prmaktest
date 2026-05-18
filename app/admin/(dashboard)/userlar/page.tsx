import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronDown, MessageSquare, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { normalizeUzbekPhone, formatPhoneDisplay } from "@/lib/phone";
import { VILOYATLAR, isViloyat } from "@/lib/viloyats";
import {
  sendAdminUserParentTelegram,
  updateParentTelegram,
  updateUserPassword,
  updateUserTelegram,
} from "./actions";
import { AdminUserFilters } from "@/components/admin/AdminUserFilters";

export const dynamic = "force-dynamic";

type Search = {
  viloyat?: string;
  tel?: string;
  noTgPage?: string;
  tgPage?: string;
  error?: string;
  id?: string;
  saved?: string;
  tgErr?: string;
  tgOk?: string;
  tgFail?: string;
  pwdErr?: string;
};

type Props = { searchParams: Promise<Search> };

const PAGE_SIZE = 10;

function parsePage(raw: string | undefined): number {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function listPageHref(opts: {
  vil?: string;
  tel?: string;
  noTgPage: number;
  tgPage: number;
}) {
  const q = new URLSearchParams();
  if (opts.vil) q.set("viloyat", opts.vil);
  if (opts.tel) q.set("tel", opts.tel);
  if (opts.noTgPage > 1) q.set("noTgPage", String(opts.noTgPage));
  if (opts.tgPage > 1) q.set("tgPage", String(opts.tgPage));
  const s = q.toString();
  return s ? `/admin/userlar?${s}` : "/admin/userlar";
}

function PaginationBar({
  label,
  page,
  totalPages,
  vil,
  tel,
  noTgPage,
  tgPage,
  pageParam,
}: {
  label: string;
  page: number;
  totalPages: number;
  vil?: string;
  tel?: string;
  noTgPage: number;
  tgPage: number;
  pageParam: "noTgPage" | "tgPage";
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) =>
    listPageHref({
      vil,
      tel,
      noTgPage: pageParam === "noTgPage" ? p : noTgPage,
      tgPage: pageParam === "tgPage" ? p : tgPage,
    });

  const nums: number[] = [];
  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, page + 2);
  for (let i = windowStart; i <= windowEnd; i++) nums.push(i);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 text-sm"
      aria-label={label}
    >
      <span className="text-slate-600">
        Sahifa <strong>{page}</strong> / {totalPages}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Oldingi
          </Link>
        ) : (
          <span className="rounded-lg border border-transparent px-3 py-1.5 text-slate-400">Oldingi</span>
        )}
        {nums.map((p) => (
          <Link
            key={p}
            href={href(p)}
            className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-center font-medium ${
              p === page
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p}
          </Link>
        ))}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Keyingi
          </Link>
        ) : (
          <span className="rounded-lg border border-transparent px-3 py-1.5 text-slate-400">Keyingi</span>
        )}
      </div>
    </nav>
  );
}

function shortUserId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 10)}…`;
}

function buildUsersWhere(
  validViloyat: string | undefined,
  telSearchRaw: string | undefined,
): Prisma.UserWhereInput | undefined {
  const parts: Prisma.UserWhereInput[] = [];
  if (validViloyat) parts.push({ viloyat: validViloyat });

  const raw = telSearchRaw?.trim();
  if (raw) {
    const normalized = normalizeUzbekPhone(raw);
    if (normalized) {
      parts.push({ phone: normalized });
    } else {
      const digits = raw.replace(/\D/g, "");
      if (digits.length >= 4) {
        const prefix =
          digits.startsWith("998") ? digits : digits.length === 9 && /^9\d{8}$/.test(digits) ? `998${digits}` : digits;
        parts.push({ phone: { startsWith: prefix } });
      }
    }
  }

  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0]! : { AND: parts };
}

function RedirectFields({ vil, tel }: { vil?: string; tel?: string }) {
  return (
    <>
      {vil ? <input type="hidden" name="redirectViloyat" value={vil} /> : null}
      {tel ? <input type="hidden" name="redirectTel" value={tel} /> : null}
    </>
  );
}

const userListSelect = {
  id: true,
  phone: true,
  firstName: true,
  lastName: true,
  parentPhone: true,
  viloyat: true,
  telegramId: true,
  parentTelegramId: true,
  telegramUsername: true,
  telegramLinkedAt: true,
  createdAt: true,
} as const;

type UserRow = Prisma.UserGetPayload<{ select: typeof userListSelect }>;

function UserCard({
  u,
  idx,
  highlightId,
  validViloyat,
  telFilter,
}: {
  u: UserRow;
  idx: number;
  highlightId?: string;
  validViloyat?: string;
  telFilter?: string;
}) {
  const missingStudentTg = u.telegramId == null;
  const parentPhoneOk = u.parentPhone.trim().length > 0;
  const missingParentTg = parentPhoneOk && u.parentTelegramId == null;
  const displayName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "—";
  const cardHighlight =
    highlightId === u.id
      ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-white"
      : missingStudentTg || missingParentTg
        ? "bg-sky-50/50"
        : "bg-white";

  return (
    <li
      className={`rounded-xl border border-slate-200/90 p-4 shadow-sm transition-shadow hover:shadow-md ${cardHighlight}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="text-xs font-semibold text-slate-400">#{idx}</span>
            <span className="font-mono text-[11px] text-slate-600" title={u.id}>
              {shortUserId(u.id)}
            </span>
          </div>
          <p className="text-base font-semibold text-slate-900">{displayName}</p>
          <div className="flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span>
              <span className="text-slate-400">Tel:</span> {formatPhoneDisplay(u.phone)}
            </span>
            <span>
              <span className="text-slate-400">Ota-ona:</span>{" "}
              {parentPhoneOk ? formatPhoneDisplay(u.parentPhone) : "—"}
            </span>
            <span>
              <span className="text-slate-400">Viloyat:</span> {u.viloyat}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {u.telegramUsername ? (
              <span className="font-mono">@{u.telegramUsername}</span>
            ) : (
              <span>@user —</span>
            )}
            <span className="mx-1.5 text-slate-300">·</span>
            Ro&apos;yxatdan:{" "}
            {u.createdAt.toLocaleString("uz-UZ", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5 sm:max-w-[14rem] sm:justify-end">
          {missingStudentTg ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              O&apos;quvchi TG yo&apos;q
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
              O&apos;quvchi TG OK
            </span>
          )}
          {missingParentTg ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Ota-ona TG yo&apos;q
            </span>
          ) : parentPhoneOk && u.parentTelegramId != null ? (
            <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-900">
              Ota-ona TG OK
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">TG — o&apos;quvchi</p>
          <form action={updateUserTelegram.bind(null, u.id)} className="mt-2 flex items-center gap-2">
            <RedirectFields vil={validViloyat} tel={telFilter} />
            <input
              name="telegramId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              title="Bo'sh qoldirsangiz Telegram ID o'chadi"
              placeholder="Telegram ID"
              defaultValue={u.telegramId != null ? String(u.telegramId) : ""}
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Saqlash
            </button>
          </form>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">TG — ota-ona</p>
          <form action={updateParentTelegram.bind(null, u.id)} className="mt-2 flex items-center gap-2">
            <RedirectFields vil={validViloyat} tel={telFilter} />
            <input
              name="parentTelegramId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              title="Bo'sh qoldirsangiz ota-ona TG o'chadi"
              placeholder="Telegram ID"
              defaultValue={u.parentTelegramId != null ? String(u.parentTelegramId) : ""}
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Saqlash
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Yangi parol (kabinet)</p>
        <form
          action={updateUserPassword.bind(null, u.id)}
          className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <RedirectFields vil={validViloyat} tel={telFilter} />
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Kamida 8 belgi"
            minLength={8}
            className="min-h-10 w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm sm:max-w-[11rem]"
          />
          <input
            name="password2"
            type="password"
            autoComplete="new-password"
            placeholder="Takrorlang"
            minLength={8}
            className="min-h-10 w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm sm:max-w-[11rem]"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Parolni yangilash
          </button>
        </form>
      </div>
    </li>
  );
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const q = await searchParams;
  const viloyatFilter = typeof q.viloyat === "string" && q.viloyat !== "" ? q.viloyat : undefined;
  const validViloyat = viloyatFilter && isViloyat(viloyatFilter) ? viloyatFilter : undefined;
  const viloyatInvalid = Boolean(viloyatFilter && !validViloyat);
  const telFilter = typeof q.tel === "string" && q.tel.trim() !== "" ? q.tel : undefined;
  const noTgPage = parsePage(q.noTgPage);
  const tgPage = parsePage(q.tgPage);

  const usersWhere = buildUsersWhere(validViloyat, telFilter);

  const [users, viloyatTotal, viloyatNoTg] = await Promise.all([
    usersWhere
      ? prisma.user.findMany({
          where: usersWhere,
          select: userListSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as UserRow[]),
    validViloyat ? prisma.user.count({ where: { viloyat: validViloyat } }) : Promise.resolve(0),
    validViloyat
      ? prisma.user.count({ where: { viloyat: validViloyat, telegramId: null } })
      : Promise.resolve(0),
  ]);

  const republicRows =
    validViloyat != null
      ? [
          {
            viloyat: validViloyat,
            total: viloyatTotal,
            noTg: viloyatNoTg,
            withTg: viloyatTotal - viloyatNoTg,
          },
        ]
      : [];

  const republicSum = {
    total: republicRows[0]?.total ?? 0,
    noTg: republicRows[0]?.noTg ?? 0,
  };

  const sortInGroup = (a: UserRow, b: UserRow) => {
    const score = (u: UserRow) =>
      (u.telegramId == null ? 2 : 0) +
      (u.parentPhone.trim() !== "" && u.parentTelegramId == null ? 1 : 0);
    const sa = score(a);
    const sb = score(b);
    if (sa !== sb) return sb - sa;
    return b.createdAt.getTime() - a.createdAt.getTime();
  };

  const usersNoTg = users.filter((u) => u.telegramId == null).sort(sortInGroup);
  const usersWithTg = users.filter((u) => u.telegramId != null).sort(sortInGroup);

  const noTgTotalPages = Math.max(1, Math.ceil(usersNoTg.length / PAGE_SIZE));
  const tgTotalPages = Math.max(1, Math.ceil(usersWithTg.length / PAGE_SIZE));
  const safeNoTgPage = Math.min(noTgPage, noTgTotalPages);
  const safeTgPage = Math.min(tgPage, tgTotalPages);

  const usersNoTgPage = usersNoTg.slice((safeNoTgPage - 1) * PAGE_SIZE, safeNoTgPage * PAGE_SIZE);
  const usersWithTgPage = usersWithTg.slice((safeTgPage - 1) * PAGE_SIZE, safeTgPage * PAGE_SIZE);

  const error = typeof q.error === "string" ? q.error : undefined;
  const highlightId = typeof q.id === "string" ? q.id : undefined;
  const saved = q.saved === "1";
  const tgErr = typeof q.tgErr === "string" ? q.tgErr : undefined;
  const pwdErr = typeof q.pwdErr === "string" ? q.pwdErr : undefined;
  const tgOkRaw = typeof q.tgOk === "string" ? Number.parseInt(q.tgOk, 10) : NaN;
  const tgFailRaw = typeof q.tgFail === "string" ? Number.parseInt(q.tgFail, 10) : NaN;
  const notifyOk = Number.isFinite(tgOkRaw) ? tgOkRaw : undefined;
  const notifyFail = Number.isFinite(tgFailRaw) ? tgFailRaw : undefined;

  const hasActiveFilter = Boolean(validViloyat || telFilter);
  const filterClearHref = "/admin/userlar";

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Userlar</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          Barcha bazani yuklash serverni ortiqcha yuklamasligi uchun <strong>foydalanuvchi kartochkalari</strong> faqat{" "}
          <strong>viloyat</strong> tanlangan yoki <strong>telefon</strong> bo&apos;yicha qidiruv ishlaganda chiqadi.
          Viloyat bo&apos;yicha qisqa statistika ham shu tanlovdan keyin ochiladi. Telefon bilan qidirganda kamida{" "}
          <strong>4 ta raqam</strong> yoki to&apos;g&apos;ri format kiriting. Har bir guruhda <strong>10 ta</strong> foydalanuvchi
          sahifalanadi.
        </p>
      </div>

      {validViloyat ? (
        <details className="group rounded-2xl border border-slate-200/90 bg-white shadow-md open:shadow-lg">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-4 pr-4 [&::-webkit-details-marker]:hidden sm:px-5">
            <ChevronDown
              className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">Viloyat bo&apos;yicha qisqa statistika</p>
              <p className="mt-0.5 text-xs text-slate-600">
                <strong>{validViloyat}</strong> — jami: <strong>{republicSum.total}</strong>, Telegram ID yo&apos;q:{" "}
                <strong className="text-amber-700">{republicSum.noTg}</strong>
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 sm:inline">
              Bosing
            </span>
          </summary>
          <div className="border-t border-slate-100 px-3 pb-4 sm:px-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-3 pl-0 pr-2">Viloyat</th>
                    <th className="px-2 py-3 text-right tabular-nums">Jami</th>
                    <th className="px-2 py-3 text-right tabular-nums text-amber-700">TG yo&apos;q</th>
                    <th className="py-3 pl-2 pr-0 text-right tabular-nums text-emerald-700">TG bor</th>
                  </tr>
                </thead>
                <tbody>
                  {republicRows.map((r) => (
                    <tr key={r.viloyat} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pl-0 pr-2 font-medium text-slate-800">{r.viloyat}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-700">{r.total}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums font-medium text-amber-800">{r.noTg}</td>
                      <td className="py-2.5 pl-2 pr-0 text-right tabular-nums text-emerald-800">{r.withTg}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="rounded-bl-lg py-3 pl-0 pr-2 text-slate-900">Jami</td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-900">{republicSum.total}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-amber-900">{republicSum.noTg}</td>
                    <td className="rounded-br-lg py-3 pl-2 pr-0 text-right tabular-nums text-emerald-900">
                      {republicSum.total - republicSum.noTg}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>
      ) : null}

      {viloyatInvalid ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          URL dagi viloyat tanlovi noto&apos;g&apos;ri — filtr qo&apos;llanmadi. Ro&apos;yxatdan tanlang; viloyat o&apos;zgarganda
          sahifa avtomatik yangilanadi.
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          O&apos;zgarishlar saqlandi.
        </p>
      ) : null}
      {pwdErr === "short" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Parol kamida 8 belgi bo&apos;lishi kerak.
        </p>
      ) : null}
      {pwdErr === "mismatch" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Parollar mos kelmayapti.
        </p>
      ) : null}
      {pwdErr === "save" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Parolni saqlab bo&apos;lmadi. Qayta urinib ko&apos;ring.
        </p>
      ) : null}
      {notifyOk != null ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          Telegram: yuborildi <strong>{notifyOk}</strong>
          {notifyFail != null && notifyFail > 0 ? (
            <>
              , yuborilmagan <strong>{notifyFail}</strong> (chat ID yoki bot bloklash / foydalanuvchi botni boshlagan
              emas).
            </>
          ) : null}
        </p>
      ) : null}
      {tgErr === "empty" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          User ID va xabar matni bo&apos;sh bo&apos;lmasligi kerak.
        </p>
      ) : null}
      {tgErr === "long" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Xabar juda uzun (maks. 4000 belgi).
        </p>
      ) : null}
      {tgErr === "nouser" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Bunday user ID topilmadi.
        </p>
      ) : null}
      {tgErr === "notoken" ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <code className="font-mono text-xs">TELEGRAM_BOT_TOKEN</code> sozlanmagan — xabar yuborib bo&apos;lmaydi.
        </p>
      ) : null}
      {tgErr === "norecipients" ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Bu foydalanuvchida na o&apos;quvchi, na ota-ona uchun Telegram ID saqlanmagan — avval jadvaldan kiriting.
        </p>
      ) : null}
      {error === "invalid" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Telegram ID faqat raqamlardan iborat bo&apos;lishi va uzunligi mos kelishi kerak (5–20 belgi).
        </p>
      ) : null}
      {error === "duplicate" ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Bu Telegram ID boshqa foydalanuvchida allaqachon band (o&apos;quvchi akkaunti).
        </p>
      ) : null}
      {error === "save" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Saqlashda xatolik. Qayta urinib ko&apos;ring.
        </p>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:p-6">
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">O&apos;quvchi va ota-onaga Telegram xabar</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Kartochkadagi <span className="font-mono">User ID</span> ni nusxalang.
            </p>
            <form
              action={sendAdminUserParentTelegram}
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <RedirectFields vil={validViloyat} tel={telFilter} />
              <div className="min-w-0 w-full sm:w-56">
                <label htmlFor="notifyUserId" className="block text-xs font-medium text-slate-500">
                  User ID
                </label>
                <input
                  id="notifyUserId"
                  name="notifyUserId"
                  type="text"
                  required
                  placeholder="cuid"
                  defaultValue={highlightId ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                />
              </div>
              <div className="min-w-0 flex-1 basis-[min(100%,20rem)]">
                <label htmlFor="notifyMessage" className="block text-xs font-medium text-slate-500">
                  Xabar matni
                </label>
                <textarea
                  id="notifyMessage"
                  name="notifyMessage"
                  required
                  rows={2}
                  placeholder="Matn…"
                  className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25 sm:min-h-[2.75rem]"
                />
              </div>
              <button
                type="submit"
                className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110 sm:w-auto"
              >
                Yuborish
              </button>
            </form>
          </div>
        </div>
      </div>

      <AdminUserFilters
        defaultViloyat={validViloyat ?? ""}
        defaultTel={telFilter ?? ""}
        viloyatOptions={VILOYATLAR}
        hasActiveFilter={hasActiveFilter}
        filterClearHref={filterClearHref}
      />

      <div className="space-y-8">
        {!usersWhere ? (
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-10 text-center shadow-sm sm:px-6">
            <p className="text-sm font-semibold text-slate-800">Foydalanuvchi ro&apos;yxati yuklanmadi</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {telFilter && !validViloyat && !viloyatInvalid ? (
                <>
                  Telefon maydoni qidiruv uchun yetarli emas — kamida <strong>4 ta raqam</strong> yoki to&apos;g&apos;ri
                  telefon formatini kiriting, so&apos;ngra <strong>Qidirish</strong> ni bosing.
                </>
              ) : (
                <>
                  Yuqoridan <strong>viloyat</strong> tanlang (sahifa avtomatik yangilanadi) yoki{" "}
                  <strong>o&apos;quvchi telefoni</strong> bo&apos;yicha qidiring.
                </>
              )}
            </p>
          </div>
        ) : null}

        {usersWhere && validViloyat ? (
          <details
            className="group overflow-hidden rounded-2xl border-2 border-amber-200/90 bg-amber-50/20 shadow-md shadow-slate-200/30 open:shadow-lg"
            open
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 border-b border-amber-100 bg-amber-50/80 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown
                className="h-5 w-5 shrink-0 text-amber-700 transition-transform group-open:rotate-180"
                aria-hidden
              />
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-950">
                Telegram yo&apos;q
              </span>
              <Users className="h-5 w-5 text-amber-700" aria-hidden />
              <span className="text-sm font-semibold text-slate-900">
                <span className="text-amber-900">{validViloyat}</span>
                {" · "}
                {usersNoTg.length} ta — TG ID kiritish kerak
                {usersNoTg.length > 0 ? (
                  <span className="ml-2 font-normal text-slate-600">
                    (ko&apos;rsatilmoqda {(safeNoTgPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safeNoTgPage * PAGE_SIZE, usersNoTg.length)})
                  </span>
                ) : null}
              </span>
            </summary>
            <div className="p-3 sm:p-4">
              {usersNoTg.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600">
                  Bu guruh bo&apos;yicha yo&apos;q{hasActiveFilter ? " (filtr natijasi)" : ""}.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {usersNoTgPage.map((u, i) => (
                      <UserCard
                        key={u.id}
                        u={u}
                        idx={(safeNoTgPage - 1) * PAGE_SIZE + i + 1}
                        highlightId={highlightId}
                        validViloyat={validViloyat}
                        telFilter={telFilter}
                      />
                    ))}
                  </ul>
                  <PaginationBar
                    label="Telegram yo'q sahifalash"
                    page={safeNoTgPage}
                    totalPages={noTgTotalPages}
                    vil={validViloyat}
                    tel={telFilter}
                    noTgPage={safeNoTgPage}
                    tgPage={safeTgPage}
                    pageParam="noTgPage"
                  />
                </>
              )}
            </div>
          </details>
        ) : null}
        {usersWhere && !validViloyat ? (
          <section className="overflow-hidden rounded-2xl border-2 border-amber-200/90 bg-amber-50/20 shadow-md shadow-slate-200/30">
            <div className="flex flex-wrap items-center gap-2 border-b border-amber-100 bg-amber-50/80 px-4 py-3">
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-950">
                Telegram yo&apos;q
              </span>
              <Users className="h-5 w-5 text-amber-700" aria-hidden />
              <span className="text-sm font-semibold text-slate-900">
                {usersNoTg.length} ta — TG ID kiritish kerak
                {usersNoTg.length > 0 ? (
                  <span className="ml-2 font-normal text-slate-600">
                    (ko&apos;rsatilmoqda {(safeNoTgPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safeNoTgPage * PAGE_SIZE, usersNoTg.length)})
                  </span>
                ) : null}
              </span>
            </div>
            <div className="p-3 sm:p-4">
              {usersNoTg.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600">
                  Bu guruh bo&apos;yicha yo&apos;q{hasActiveFilter ? " (filtr natijasi)" : ""}.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {usersNoTgPage.map((u, i) => (
                      <UserCard
                        key={u.id}
                        u={u}
                        idx={(safeNoTgPage - 1) * PAGE_SIZE + i + 1}
                        highlightId={highlightId}
                        validViloyat={validViloyat}
                        telFilter={telFilter}
                      />
                    ))}
                  </ul>
                  <PaginationBar
                    label="Telegram yo'q sahifalash"
                    page={safeNoTgPage}
                    totalPages={noTgTotalPages}
                    vil={validViloyat}
                    tel={telFilter}
                    noTgPage={safeNoTgPage}
                    tgPage={safeTgPage}
                    pageParam="noTgPage"
                  />
                </>
              )}
            </div>
          </section>
        ) : null}

        {usersWhere && validViloyat ? (
          <details
            className="group overflow-hidden rounded-2xl border-2 border-emerald-200/90 bg-emerald-50/15 shadow-md shadow-slate-200/30 open:shadow-lg"
            open
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 border-b border-emerald-100 bg-emerald-50/70 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown
                className="h-5 w-5 shrink-0 text-emerald-700 transition-transform group-open:rotate-180"
                aria-hidden
              />
              <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-950">
                Telegram bor
              </span>
              <Users className="h-5 w-5 text-emerald-700" aria-hidden />
              <span className="text-sm font-semibold text-slate-900">
                <span className="text-emerald-900">{validViloyat}</span>
                {" · "}
                {usersWithTg.length} ta
                {usersWithTg.length > 0 ? (
                  <span className="ml-2 font-normal text-slate-600">
                    (ko&apos;rsatilmoqda {(safeTgPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safeTgPage * PAGE_SIZE, usersWithTg.length)})
                  </span>
                ) : null}
              </span>
            </summary>
            <div className="p-3 sm:p-4">
              {usersWithTg.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600">
                  Bu guruh bo&apos;yicha yo&apos;q{hasActiveFilter ? " (filtr natijasi)" : ""}.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {usersWithTgPage.map((u, i) => (
                      <UserCard
                        key={u.id}
                        u={u}
                        idx={(safeTgPage - 1) * PAGE_SIZE + i + 1}
                        highlightId={highlightId}
                        validViloyat={validViloyat}
                        telFilter={telFilter}
                      />
                    ))}
                  </ul>
                  <PaginationBar
                    label="Telegram bor sahifalash"
                    page={safeTgPage}
                    totalPages={tgTotalPages}
                    vil={validViloyat}
                    tel={telFilter}
                    noTgPage={safeNoTgPage}
                    tgPage={safeTgPage}
                    pageParam="tgPage"
                  />
                </>
              )}
            </div>
          </details>
        ) : null}
        {usersWhere && !validViloyat ? (
          <section className="overflow-hidden rounded-2xl border-2 border-emerald-200/90 bg-emerald-50/15 shadow-md shadow-slate-200/30">
            <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-950">
                Telegram bor
              </span>
              <Users className="h-5 w-5 text-emerald-700" aria-hidden />
              <span className="text-sm font-semibold text-slate-900">
                {usersWithTg.length} ta
                {usersWithTg.length > 0 ? (
                  <span className="ml-2 font-normal text-slate-600">
                    (ko&apos;rsatilmoqda {(safeTgPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safeTgPage * PAGE_SIZE, usersWithTg.length)})
                  </span>
                ) : null}
              </span>
            </div>
            <div className="p-3 sm:p-4">
              {usersWithTg.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600">
                  Bu guruh bo&apos;yicha yo&apos;q{hasActiveFilter ? " (filtr natijasi)" : ""}.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {usersWithTgPage.map((u, i) => (
                      <UserCard
                        key={u.id}
                        u={u}
                        idx={(safeTgPage - 1) * PAGE_SIZE + i + 1}
                        highlightId={highlightId}
                        validViloyat={validViloyat}
                        telFilter={telFilter}
                      />
                    ))}
                  </ul>
                  <PaginationBar
                    label="Telegram bor sahifalash"
                    page={safeTgPage}
                    totalPages={tgTotalPages}
                    vil={validViloyat}
                    tel={telFilter}
                    noTgPage={safeNoTgPage}
                    tgPage={safeTgPage}
                    pageParam="tgPage"
                  />
                </>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
