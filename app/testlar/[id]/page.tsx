import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, ListChecks, Banknote, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPriceSum } from "@/lib/format-uzs";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { examTestVisibleForUserGrade } from "@/lib/exam-program";
import { ProseLongform } from "@/components/content/ProseLongform";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function formatAttemptDuration(secondsUsed: number | null): string {
  const s = Math.max(0, secondsUsed ?? 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r} soniya`;
  if (r === 0) return `${m} daqiqa`;
  return `${m} daqiqa ${r} soniya`;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const test = await prisma.test.findFirst({
    where: { id, isPublished: true },
    select: { title: true },
  });
  if (!test) return { title: "Test topilmadi" };
  return { title: `${test.title} — Testlar` };
}

export default async function TestDetailPage({ params }: Props) {
  const { id } = await params;
  const [test, userId] = await Promise.all([
    prisma.test.findFirst({
      where: { id, isPublished: true },
      include: { _count: { select: { questions: true } } },
    }),
    getStudentSessionUserId(),
  ]);
  if (!test) notFound();

  let cohortBlocked = false;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { gradeLevel: true },
    });
    if (u && !examTestVisibleForUserGrade(test, u.gradeLevel)) cohortBlocked = true;
  }

  const userAttempt =
    userId != null
      ? await prisma.testAttempt.findFirst({
          where: { userId, testId: id },
          select: {
            score: true,
            total: true,
            secondsUsed: true,
            rankPoints: true,
            createdAt: true,
          },
        })
      : null;
  const userCompleted = !!userAttempt;

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-gradient-to-b from-sky-50/80 via-white to-teal-50/20">
      <header className="border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-3xl flex-wrap items-center justify-between gap-2 pad-x-page py-2 sm:h-16 sm:flex-nowrap sm:py-0">
          <Link
            href="/testlar"
            className="flex min-h-11 min-w-0 max-w-[55%] items-center gap-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-sky-50 hover:text-blue-700 active:bg-sky-100 sm:max-w-none"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Barcha testlar</span>
          </Link>
          <Link
            href="/kabinet"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 sm:px-3"
          >
            Kabinet
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl pad-x-page py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {test.subject || "Test"}
        </p>
        <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {test.title}
        </h1>
        {test.description ? (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-teal-800">Tavsif</h2>
            <div className="mt-3">
              <ProseLongform text={test.description} renderMath />
            </div>
          </div>
        ) : null}

        <h2 className="mt-10 text-lg font-bold text-slate-900 sm:text-xl">Test haqida</h2>
        <p className="mt-2 text-sm text-slate-600">
          Quyidagi parametrlarni ko‘rib chiqing. Taymer va to‘lov (agar bor bo‘lsa) faqat keyingi qadamda —
          «Boshlash»ni bosganingizdan keyin boshlanadi.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {userCompleted ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-950 ring-1 ring-sky-200/80">
              <CheckCircle2 className="h-4 w-4 text-sky-600" aria-hidden />
              Rasmiy topshiruv qilingan — qayta mashq mumkin
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800">
            <Clock className="h-4 w-4 text-slate-500" aria-hidden />
            {test.durationMinutes} daqiqa
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900">
            <ListChecks className="h-4 w-4 text-blue-600" aria-hidden />
            {test._count.questions} ta savol
          </span>
          {test.priceSum > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
              <Banknote className="h-4 w-4 text-emerald-600" aria-hidden />
              {formatPriceSum(test.priceSum)}
            </span>
          ) : null}
          {test.stage ? (
            <span className="inline-flex items-center rounded-full bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900">
              Bosqich: {test.stage}
            </span>
          ) : null}
        </div>

        {userAttempt ? (
          <div className="mt-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-sm ring-1 ring-emerald-100/60 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80">
                <Trophy className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Sizning rasmiy natijangiz</p>
                <p className="mt-1 text-xs text-slate-600">
                  Birinchi (reytingga hisoblangan) topshiruv —{" "}
                  {userAttempt.createdAt.toLocaleString("uz-UZ", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-100">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">To&apos;g&apos;ri</dt>
                    <dd className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                      {userAttempt.score}/{userAttempt.total}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-100">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reyting balli</dt>
                    <dd className="mt-0.5 text-lg font-bold tabular-nums text-amber-700">+{userAttempt.rankPoints}</dd>
                  </div>
                  <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-100 sm:col-span-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sarflangan vaqt</dt>
                    <dd className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                      {formatAttemptDuration(userAttempt.secondsUsed)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Testni boshlash</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Savollar</dt>
              <dd className="mt-0.5 font-bold tabular-nums text-slate-900">{test._count.questions} ta</dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vaqt</dt>
              <dd className="mt-0.5 font-bold tabular-nums text-slate-900">{test.durationMinutes} daqiqa</dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Test narxi</dt>
              <dd className="mt-0.5 font-bold text-slate-900">
                {test.priceSum > 0 ? formatPriceSum(test.priceSum) : "Bepul"}
              </dd>
            </div>
          </dl>
          {userCompleted ? (
            <p className="mt-4 rounded-xl bg-sky-50/90 px-3 py-2 text-xs leading-relaxed text-sky-950 ring-1 ring-sky-200/80">
              <strong>Qayta yechish</strong> — mashq rejimi: balansdan pul yechilmaydi, rasmiy natija va reyting
              o‘zgarmaydi.
            </p>
          ) : cohortBlocked ? (
            <p className="mt-4 rounded-xl bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950 ring-1 ring-amber-200/80">
              Bu test <strong>sizning sinf blok</strong>i uchun mos emas — katalogni sinf asosida ochganingizda u ko&apos;rinmaydi. Agar profilingizdagisi noto&apos;g&apos;ri bo&apos;lsa,
              sahifadan sinfni yangilang yoki boshqa testni tanlang.
            </p>
          ) : test.priceSum > 0 ? (
            <p className="mt-4 rounded-xl bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950 ring-1 ring-amber-200/80">
              «Boshlash»ni bosganingizda test narxi balansdan <strong>bir marta</strong> yechiladi va taymer
              ishga tushadi. Balans yetmasa, avval kabinetda to‘ldirasiz.
            </p>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              «Boshlash»ni bosganingizda taymer ishga tushadi. Bu test bepul.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {test._count.questions > 0 ? (
              userCompleted ? (
                <Link
                  href={`/testlar/${id}/boshlash`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-sky-300 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-950 shadow-sm hover:bg-sky-100 active:brightness-95 sm:w-auto sm:py-2.5"
                >
                  Qayta yechishni boshlash
                </Link>
              ) : cohortBlocked ? (
                <span className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 sm:w-auto sm:py-2.5">
                  Sinf mos emas
                </span>
              ) : (
                <Link
                  href={`/testlar/${id}/boshlash`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 active:brightness-95 sm:w-auto sm:py-2.5"
                >
                  Boshlash
                </Link>
              )
            ) : null}
            <Link
              href="/kabinet"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 active:bg-slate-100 sm:w-auto sm:py-2.5"
            >
              Kabinetga qaytish
            </Link>
            {!userId ? (
              <Link
                href="/auth/kirish"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 active:bg-slate-100 sm:w-auto sm:py-2.5"
              >
                Kirish
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}
