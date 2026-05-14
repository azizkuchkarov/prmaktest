import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, ListChecks, Banknote, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPriceSum } from "@/lib/format-uzs";
import { getStudentSessionUserId } from "@/lib/student-auth";

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
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50/80 via-white to-teal-50/20">
      <header className="border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-3xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
          <Link
            href="/testlar"
            className="flex min-h-11 min-w-0 max-w-[55%] items-center gap-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-sky-50 hover:text-blue-700 active:bg-sky-100 sm:max-w-none"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Barcha testlar</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              href="/kabinet"
              className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
            >
              Kabinet
            </Link>
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
            >
              Bosh
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-3 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {test.subject || "Test"}
        </p>
        <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {test.title}
        </h1>
        {test.description ? (
          <p className="mt-4 text-base leading-relaxed text-slate-700">{test.description}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
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
          <p className="text-sm font-medium text-slate-800">Keyingi qadam</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Taymer va javoblar bilan testni onlayn yeching. Tugagach ball va (agar bo&apos;lsa)
            yechimlar ko&apos;rsatiladi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {test._count.questions > 0 ? (
              userCompleted ? (
                <Link
                  href={`/testlar/${id}/boshlash`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-sky-300 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-950 shadow-sm hover:bg-sky-100 active:brightness-95 sm:w-auto sm:py-2.5"
                >
                  Qayta yechish (reyting va pul — o‘zgarmaydi)
                </Link>
              ) : (
                <Link
                  href={`/testlar/${id}/boshlash`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 active:brightness-95 sm:w-auto sm:py-2.5"
                >
                  Testni boshlash
                </Link>
              )
            ) : null}
            <Link
              href="/kabinet"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 active:bg-slate-100 sm:w-auto sm:py-2.5"
            >
              Kabinetga qaytish
            </Link>
            <Link
              href="/auth/kirish"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 active:bg-slate-100 sm:w-auto sm:py-2.5"
            >
              Kirish
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
