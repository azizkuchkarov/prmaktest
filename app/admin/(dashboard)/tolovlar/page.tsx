import Link from "next/link";
import type { Prisma } from "@prisma/client";
import type { DepositStatus } from "@prisma/client";
import { BookOpen, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { normalizeUzbekPhone, formatPhoneDisplay } from "@/lib/phone";
import { VILOYATLAR, isViloyat } from "@/lib/viloyats";
import { formatPriceSum } from "@/lib/format-uzs";
import { AdminDepositFilters } from "@/components/admin/AdminDepositFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
/** Filtrsiz: barcha turlar bo‘yicha oxirgi N ta voqea (balans + test). */
const RECENT_WITHOUT_FILTER = 10;
/** Filtrlangan birlashtirishda har bir manbadan yuklanadigan yuqori chegaro. */
const MERGE_FETCH_CAP = 4000;

type Search = {
  viloyat?: string;
  tel?: string;
  status?: string;
  page?: string;
};

type Props = { searchParams: Promise<Search> };

type UserMini = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  viloyat: string;
};

/** Jadval uchun yagona qator — CLICK depozit yoki balansdan test xaridi. */
type UnifiedEvent = {
  kind: "deposit" | "test";
  id: string;
  at: Date;
  amount: number;
  user: UserMini;
  deposit?: {
    prepareSeq: number;
    status: DepositStatus;
    clickTransId: string | null;
    completedAt: Date | null;
  };
  test?: {
    testId: string;
    testTitle: string;
  };
};

const depositSelect = {
  id: true,
  prepareSeq: true,
  amountSum: true,
  status: true,
  clickTransId: true,
  createdAt: true,
  completedAt: true,
  user: {
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      viloyat: true,
    },
  },
} as const;

const testChargeSelect = {
  id: true,
  createdAt: true,
  chargedSum: true,
  testId: true,
  test: { select: { id: true, title: true } },
  user: {
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      viloyat: true,
    },
  },
} as const;

function parsePage(raw: string | undefined): number {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function parseStatus(raw: string | undefined): DepositStatus | "" {
  if (raw === "PENDING" || raw === "COMPLETED" || raw === "CANCELLED") return raw;
  return "";
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

function toUnifiedDeposit(
  d: Prisma.BalanceDepositGetPayload<{ select: typeof depositSelect }>,
): UnifiedEvent {
  return {
    kind: "deposit",
    id: `d:${d.id}`,
    at: d.createdAt,
    amount: d.amountSum,
    user: d.user,
    deposit: {
      prepareSeq: d.prepareSeq,
      status: d.status,
      clickTransId: d.clickTransId,
      completedAt: d.completedAt,
    },
  };
}

function toUnifiedTestCharge(
  p: Prisma.TestProgressGetPayload<{ select: typeof testChargeSelect }>,
): UnifiedEvent {
  return {
    kind: "test",
    id: `t:${p.id}`,
    at: p.createdAt,
    amount: p.chargedSum,
    user: p.user,
    test: { testId: p.testId, testTitle: p.test.title },
  };
}

function mergeEvents(deposits: UnifiedEvent[], tests: UnifiedEvent[]): UnifiedEvent[] {
  return [...deposits, ...tests].sort((a, b) => b.at.getTime() - a.at.getTime());
}

function listHref(opts: { vil?: string; tel?: string; status?: DepositStatus | ""; page: number }) {
  const q = new URLSearchParams();
  if (opts.vil) q.set("viloyat", opts.vil);
  if (opts.tel) q.set("tel", opts.tel);
  if (opts.status) q.set("status", opts.status);
  if (opts.page > 1) q.set("page", String(opts.page));
  const s = q.toString();
  return s ? `/admin/tolovlar?${s}` : "/admin/tolovlar";
}

export default async function AdminDepositsPage({ searchParams }: Props) {
  const q = await searchParams;
  const rawVil = q.viloyat?.trim();
  const validViloyat = rawVil && isViloyat(rawVil) ? rawVil : undefined;
  const telFilter = q.tel?.trim() || "";
  const statusFilter = parseStatus(q.status?.trim());
  const page = parsePage(q.page);

  const userWhere = buildUsersWhere(validViloyat, telFilter || undefined);
  const hasUserScope = Boolean(userWhere);
  const depositWhere: Prisma.BalanceDepositWhereInput = {};
  if (userWhere) depositWhere.user = userWhere;
  if (statusFilter) depositWhere.status = statusFilter;

  const hasActiveFilter = Boolean(validViloyat || telFilter || statusFilter);
  /** Test xaridlari: foydalanuvchi filtri bo‘lganda yoki umuman filtrsiz; faqat depozit holati filtri bo‘lsa — testlar chiqmasin. */
  const includeTestCharges = !hasActiveFilter || hasUserScope;

  let rows: UnifiedEvent[] = [];
  let totalPages = 1;
  let filteredTotal: number | null = null;
  let totalInDbHint: string | null = null;

  /** Filtr natijasida aynan bitta user bo‘lsa — sotib olingan testlar. */
  let purchasedTestsForSingleUser: {
    testId: string;
    title: string;
    chargedSum: number;
    startedAt: Date;
  }[] = [];

  if (!hasActiveFilter) {
    const [depCount, testChargeCount, depBatch, testBatch] = await Promise.all([
      prisma.balanceDeposit.count(),
      prisma.testProgress.count({ where: { chargedSum: { gt: 0 } } }),
      prisma.balanceDeposit.findMany({
        orderBy: { createdAt: "desc" },
        take: RECENT_WITHOUT_FILTER * 3,
        select: depositSelect,
      }),
      prisma.testProgress.findMany({
        where: { chargedSum: { gt: 0 } },
        orderBy: { createdAt: "desc" },
        take: RECENT_WITHOUT_FILTER * 3,
        select: testChargeSelect,
      }),
    ]);
    rows = mergeEvents(
      depBatch.map(toUnifiedDeposit),
      testBatch.map(toUnifiedTestCharge),
    ).slice(0, RECENT_WITHOUT_FILTER);
    totalInDbHint = `${depCount} CLICK yozuv · ${testChargeCount} test xaridi`;
  } else {
    const testWhere: Prisma.TestProgressWhereInput | undefined = includeTestCharges
      ? {
          chargedSum: { gt: 0 },
          ...(userWhere ? { user: userWhere } : {}),
        }
      : undefined;

    const [depCnt, testCnt, depList, testList] = await Promise.all([
      prisma.balanceDeposit.count({ where: depositWhere }),
      testWhere
        ? prisma.testProgress.count({ where: testWhere })
        : Promise.resolve(0),
      prisma.balanceDeposit.findMany({
        where: depositWhere,
        orderBy: { createdAt: "desc" },
        take: MERGE_FETCH_CAP,
        select: depositSelect,
      }),
      testWhere
        ? prisma.testProgress.findMany({
            where: testWhere,
            orderBy: { createdAt: "desc" },
            take: MERGE_FETCH_CAP,
            select: testChargeSelect,
          })
        : Promise.resolve([]),
    ]);

    filteredTotal = depCnt + testCnt;
    totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
    const merged = mergeEvents(depList.map(toUnifiedDeposit), testList.map(toUnifiedTestCharge));
    rows = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (userWhere) {
      const matchedUsers = await prisma.user.findMany({
        where: userWhere,
        select: { id: true },
        take: 2,
      });
      if (matchedUsers.length === 1) {
        purchasedTestsForSingleUser = await prisma.testProgress.findMany({
          where: { userId: matchedUsers[0].id, chargedSum: { gt: 0 } },
          orderBy: { createdAt: "desc" },
          select: {
            testId: true,
            chargedSum: true,
            createdAt: true,
            test: { select: { title: true } },
          },
        }).then((list) =>
          list.map((x) => ({
            testId: x.testId,
            title: x.test.title,
            chargedSum: x.chargedSum,
            startedAt: x.createdAt,
          })),
        );
      }
    }
  }

  const stats = await prisma.balanceDeposit.groupBy({
    by: ["status"],
    _sum: { amountSum: true },
    _count: { _all: true },
  });
  const sumByStatus = Object.fromEntries(
    stats.map((s) => [s.status, { sum: s._sum.amountSum ?? 0, n: s._count._all }]),
  ) as Record<string, { sum: number; n: number }>;

  const testSpendAgg = await prisma.testProgress.aggregate({
    where: { chargedSum: { gt: 0 } },
    _sum: { chargedSum: true },
    _count: { _all: true },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Wallet className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Balans va test to&apos;lovlari</h1>
            <p className="mt-1 text-sm text-slate-600">
              <strong>CLICK</strong> orqali balans to&apos;ldirish va balansdan <strong>pullik test</strong> uchun
              yechilgan summalar. Filtrsiz — oxirgi {RECENT_WITHOUT_FILTER} ta voqea (ixcham); viloyat / telefon /
              holat bilan qidiring — jadval va (bitta user bo&apos;lsa) sotib olingan testlar ro&apos;yxati.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["COMPLETED", "PENDING", "CANCELLED"] as const).map((st) => {
            const x = sumByStatus[st];
            const sum = x?.sum ?? 0;
            const n = x?.n ?? 0;
            const label =
              st === "COMPLETED" ? "CLICK yakunlangan" : st === "PENDING" ? "CLICK kutilmoqda" : "CLICK bekor";
            return (
              <div
                key={st}
                className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm shadow-sm"
              >
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">{n} ta</p>
                <p className="text-xs text-slate-600">{formatPriceSum(sum) || "0 so'm"}</p>
              </div>
            );
          })}
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/90 px-4 py-3 text-sm shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-indigo-700">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Test xaridi (balansdan)
            </p>
            <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
              {testSpendAgg._count._all} ta
            </p>
            <p className="text-xs text-slate-600">{formatPriceSum(testSpendAgg._sum.chargedSum ?? 0) || "0 so'm"}</p>
          </div>
        </div>
      </div>

      <AdminDepositFilters
        defaultViloyat={validViloyat ?? ""}
        defaultTel={telFilter}
        defaultStatus={statusFilter}
        viloyatOptions={VILOYATLAR}
        hasActiveFilter={hasActiveFilter}
        filterClearHref="/admin/tolovlar"
      />

      {purchasedTestsForSingleUser.length > 0 ? (
        <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-indigo-950">Bu foydalanuvchi sotib olgan pullik testlar</h2>
          <p className="mt-0.5 text-xs text-indigo-900/80">
            Test boshlanganda balansdan yechilgan (`chargedSum &gt; 0`).
          </p>
          <ul className="mt-3 divide-y divide-indigo-100 rounded-xl border border-indigo-100/80 bg-white">
            {purchasedTestsForSingleUser.map((t) => (
              <li key={t.testId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <Link
                    href={`/admin/testlar/${t.testId}`}
                    className="font-semibold text-[#2563EB] hover:text-violet-700 hover:underline"
                  >
                    {t.title}
                  </Link>
                  <p className="font-mono text-[10px] text-slate-500">{t.testId}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-slate-900">{formatPriceSum(t.chargedSum)}</p>
                  <p className="text-[10px] text-slate-500">
                    {t.startedAt.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!includeTestCharges && hasActiveFilter ? (
        <p className="text-xs text-amber-800">
          <strong>Eslatma:</strong> faqat depozit holati tanlangan. Test xaridlari uchun viloyat yoki telefon ham
          kiriting.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/40">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
          {hasActiveFilter ? (
            <p className="text-sm text-slate-600">
              Jami: <strong className="text-slate-900">{filteredTotal ?? 0}</strong> yozuv — CLICK + test xaridlari
              (sahifa <strong>{page}</strong> / {totalPages})
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">Oxirgi {rows.length}</strong> ta voqea (balans va test aralash)
              {totalInDbHint ? (
                <>
                  . Bazada: <span className="font-medium text-slate-800">{totalInDbHint}</span> — batafsil qidirish
                  uchun filtrlang.
                </>
              ) : (
                "."
              )}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3 sm:px-4">Tur</th>
                <th className="px-3 py-3 sm:px-4">Vaqt</th>
                <th className="px-3 py-3 sm:px-4">Tafsilot</th>
                <th className="px-3 py-3 sm:px-4">Foydalanuvchi</th>
                <th className="px-3 py-3 sm:px-4">Viloyat</th>
                <th className="px-3 py-3 sm:px-4">Summa</th>
                <th className="px-3 py-3 sm:px-4">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Ma&apos;lumot topilmadi.
                    {hasActiveFilter ? " Filtrlarni o‘zgartirib ko‘ring." : null}
                  </td>
                </tr>
              ) : (
                rows.map((ev) => {
                  const u = ev.user;
                  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "—";
                  if (ev.kind === "deposit" && ev.deposit) {
                    const d = ev.deposit;
                    const statusLabel =
                      d.status === "COMPLETED" ? "Yakunlangan" : d.status === "PENDING" ? "Kutilmoqda" : "Bekor";
                    const statusClass =
                      d.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-900"
                        : d.status === "PENDING"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-200 text-slate-800";
                    return (
                      <tr key={ev.id} className="bg-white hover:bg-slate-50/80">
                        <td className="px-3 py-3 sm:px-4">
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-100">
                            Balans · CLICK
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600 sm:px-4">
                          {ev.at.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                          {d.completedAt ? (
                            <span className="block text-[10px] text-emerald-700">
                              ✓ {d.completedAt.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-[240px] px-3 py-3 sm:px-4">
                          <p className="font-mono text-xs tabular-nums text-slate-800">prepare #{d.prepareSeq}</p>
                          <p className="truncate font-mono text-[10px] text-slate-500" title={d.clickTransId ?? ""}>
                            {d.clickTransId ?? "—"}
                          </p>
                        </td>
                        <td className="max-w-[200px] px-3 py-3 sm:px-4">
                          <p className="truncate font-semibold text-slate-900" title={name}>
                            {name}
                          </p>
                          <p className="truncate font-mono text-[10px] text-slate-500">{u.id}</p>
                          <p className="font-mono text-[11px] text-slate-600">{formatPhoneDisplay(u.phone)}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-700 sm:px-4">{u.viloyat}</td>
                        <td className="px-3 py-3 font-mono text-sm font-bold tabular-nums text-slate-900 sm:px-4">
                          {formatPriceSum(ev.amount)}
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  if (ev.kind === "test" && ev.test) {
                    const t = ev.test;
                    return (
                      <tr key={ev.id} className="bg-violet-50/40 hover:bg-violet-50/70">
                        <td className="px-3 py-3 sm:px-4">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-900 ring-1 ring-violet-200/80">
                            <BookOpen className="h-3 w-3" aria-hidden />
                            Test xaridi
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600 sm:px-4">
                          {ev.at.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="max-w-[280px] px-3 py-3 sm:px-4">
                          <Link
                            href={`/admin/testlar/${t.testId}`}
                            className="line-clamp-2 text-sm font-semibold text-[#2563EB] hover:text-violet-700 hover:underline"
                            title={t.testTitle}
                          >
                            {t.testTitle}
                          </Link>
                          <p className="font-mono text-[10px] text-slate-500">{t.testId}</p>
                        </td>
                        <td className="max-w-[200px] px-3 py-3 sm:px-4">
                          <p className="truncate font-semibold text-slate-900" title={name}>
                            {name}
                          </p>
                          <p className="truncate font-mono text-[10px] text-slate-500">{u.id}</p>
                          <p className="font-mono text-[11px] text-slate-600">{formatPhoneDisplay(u.phone)}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-700 sm:px-4">{u.viloyat}</td>
                        <td className="px-3 py-3 font-mono text-sm font-bold tabular-nums text-slate-900 sm:px-4">
                          {formatPriceSum(ev.amount)}
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <span className="inline-flex rounded-lg bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-900">
                            Yechilgan
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  return null;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasActiveFilter && totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Sahifalar">
          <span className="text-slate-600">
            Sahifa <strong>{page}</strong> / {totalPages}
          </span>
          <div className="flex flex-wrap gap-1">
            {page > 1 ? (
              <Link
                href={listHref({
                  vil: validViloyat,
                  tel: telFilter || undefined,
                  status: statusFilter,
                  page: page - 1,
                })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Oldingi
              </Link>
            ) : null}
            {(() => {
              const nums: number[] = [];
              const windowStart = Math.max(1, page - 2);
              const windowEnd = Math.min(totalPages, page + 2);
              for (let i = windowStart; i <= windowEnd; i++) nums.push(i);
              return nums.map((p) => (
                <Link
                  key={p}
                  href={listHref({
                    vil: validViloyat,
                    tel: telFilter || undefined,
                    status: statusFilter,
                    page: p,
                  })}
                  className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-center font-medium ${
                    p === page
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </Link>
              ));
            })()}
            {page < totalPages ? (
              <Link
                href={listHref({
                  vil: validViloyat,
                  tel: telFilter || undefined,
                  status: statusFilter,
                  page: page + 1,
                })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Keyingi
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
