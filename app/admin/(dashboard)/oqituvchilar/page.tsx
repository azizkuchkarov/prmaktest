import Link from "next/link";
import { BookUser, GraduationCap, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildTeacherUsersWhere } from "@/lib/admin-user-geo-tel-where";
import { VILOYATLAR, isViloyat } from "@/lib/viloyats";
import {
  AdminTeacherProfileCard,
  adminTeacherListSelect,
  type AdminTeacherRow,
} from "@/components/admin/AdminTeacherProfileCard";
import { AdminUserFilters } from "@/components/admin/AdminUserFilters";

export const dynamic = "force-dynamic";

type Search = {
  viloyat?: string;
  tel?: string;
  error?: string;
  id?: string;
  saved?: string;
  pwdErr?: string;
  delErr?: string;
  deleted?: string;
};

type Props = { searchParams: Promise<Search> };

export default async function AdminOqituvchilarPage({ searchParams }: Props) {
  const q = await searchParams;
  const viloyatFilter = typeof q.viloyat === "string" && q.viloyat !== "" ? q.viloyat : undefined;
  const validViloyat = viloyatFilter && isViloyat(viloyatFilter) ? viloyatFilter : undefined;
  const viloyatInvalid = Boolean(viloyatFilter && !validViloyat);
  const telFilter = typeof q.tel === "string" && q.tel.trim() !== "" ? q.tel : undefined;

  const teachersWhere = buildTeacherUsersWhere(validViloyat, telFilter);

  const [rows, stats] = await Promise.all([
    teachersWhere
      ? prisma.user.findMany({
          where: teachersWhere,
          select: adminTeacherListSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as AdminTeacherRow[]),
    prisma.user.groupBy({
      by: ["appUserRole"],
      where: { appUserRole: { in: ["TEACHER", "TEACHER_PENDING"] } },
      _count: { _all: true },
    }),
  ]);

  const teacherCount = stats.find((s) => s.appUserRole === "TEACHER")?._count._all ?? 0;
  const pendingCount = stats.find((s) => s.appUserRole === "TEACHER_PENDING")?._count._all ?? 0;

  const sortedRows = [...rows].sort((a, b) => {
    if (a.appUserRole === b.appUserRole) return b.createdAt.getTime() - a.createdAt.getTime();
    return a.appUserRole === "TEACHER_PENDING" ? -1 : 1;
  });

  const error = typeof q.error === "string" ? q.error : undefined;
  const highlightId = typeof q.id === "string" ? q.id : undefined;
  const saved = q.saved === "1";
  const pwdErr = typeof q.pwdErr === "string" ? q.pwdErr : undefined;
  const deleted = q.deleted === "1";
  const delErr = typeof q.delErr === "string" ? q.delErr : undefined;

  const hasActiveFilter = Boolean(validViloyat || telFilter);
  const filterClearHref = "/admin/oqituvchilar";

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:px-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <BookUser className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">O&apos;qituvchilar</h1>
            <p className="mt-1 text-sm text-slate-600">
              Tasdiqlangan va kutilayotgan o&apos;qituvchi akkauntlari. O&apos;quvchilar:{" "}
              <Link href="/admin/userlar" className="font-semibold text-[#2563EB] underline hover:text-violet-700">
                Userlar
              </Link>
              .
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Respublika: <strong className="text-slate-800">{teacherCount}</strong> tasdiqlangan,{" "}
              <strong className="text-amber-800">{pendingCount}</strong> tasdiq kutilmoqda ·{" "}
              <Link
                href="/admin/oqituvchi-tasdiq"
                className="inline-flex items-center gap-1 font-semibold text-[#2563EB] underline hover:text-violet-700"
              >
                <GraduationCap className="inline h-3.5 w-3.5" aria-hidden />
                Faqat navbat ro&apos;yxati
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AdminUserFilters
        defaultViloyat={validViloyat ?? ""}
        defaultTel={telFilter ?? ""}
        viloyatOptions={VILOYATLAR}
        hasActiveFilter={hasActiveFilter}
        filterClearHref={filterClearHref}
        telFieldLabel="Telefon (qidiruv)"
      />

      {viloyatInvalid ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Viloyat parametri noto&apos;g&apos;ri — filtr qo&apos;llanmadi.
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          O&apos;zgarishlar saqlandi.
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          Foydalanuvchi bazadan o&apos;chirildi.
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
      {delErr === "phone" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          O&apos;chirish uchun kiritilgan telefon kartochkadagi raqam bilan mos kelmaydi.
        </p>
      ) : null}
      {delErr === "noack" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          O&apos;chirish uchun &quot;Tushundim&quot; belgisini qo&apos;ying.
        </p>
      ) : null}
      {delErr === "teacher_ack" ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
          Virtual sinflar bilan birga o&apos;chirish uchun ikkinchi belgini ham qo&apos;ying.
        </p>
      ) : null}
      {delErr === "notfound" || delErr === "noid" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Bunday user topilmadi yoki yozuv aniqlanmadi.
        </p>
      ) : null}
      {delErr === "save" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Foydalanuvchini o&apos;chirib bo&apos;lmadi. Qayta urinib ko&apos;ring.
        </p>
      ) : null}
      {error === "invalid" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Telegram ID faqat raqamlardan iborat bo&apos;lishi va uzunligi mos kelishi kerak (5–20 belgi).
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

      {!teachersWhere ? (
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-10 text-center shadow-sm sm:px-6">
          <Search className="mx-auto mb-3 h-6 w-6 text-slate-400" aria-hidden />
          <p className="text-sm font-semibold text-slate-800">Ro&apos;yxat uchun filtr kiriting</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Yukoridan <strong>viloyat</strong> tanlang yoki <strong>telefon</strong> bo&apos;yicha qidiring, so&apos;ngra{" "}
            <strong>Qidirish</strong>.
          </p>
        </div>
      ) : sortedRows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Bu filtr bo&apos;yicha o&apos;qituvchi topilmadi.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Topildi: <strong className="text-slate-900">{sortedRows.length}</strong>
            {sortedRows.some((x) => x.appUserRole === "TEACHER_PENDING") ? (
              <>
                {" "}
                (navbatdagilar yuqoriga qarashgan tartibda)
              </>
            ) : null}
          </p>
          <ul className="space-y-3">
            {sortedRows.map((u, i) => (
              <AdminTeacherProfileCard
                key={u.id}
                u={u}
                idx={i + 1}
                highlightId={highlightId}
                validViloyat={validViloyat}
                telFilter={telFilter}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
