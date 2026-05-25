import Link from "next/link";
import { redirect } from "next/navigation";
import {
  markStudentVirtualSinflarSeenAction,
  studentAcceptTeacherInvite,
  studentDeclineMembership,
} from "./actions";
import { NewsStatusBadge } from "@/components/news/NewsStatusBadge";
import {
  countStudentMemberNews,
  isVirtualActivityNew,
  studentMemberHasNews,
} from "@/lib/virtual-class-new";
import { getCurrentStudent } from "@/lib/student-auth";
import { formatPhoneDisplay } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { isStudentProfileComplete, studentDisplayName } from "@/lib/student-profile";
import { TEACHER_LOGIN_HOME } from "@/lib/user-app-role";
import { JoinVirtualClassSection } from "./join-section";
import { LeaderboardBoardTable } from "@/components/kabinet/LeaderboardBoardTable";
import {
  getVirtualClassLeaderboard,
  virtualClassLbToLeaderboardRows,
} from "@/lib/virtual-class-leaderboard";
import { formatPriceSum } from "@/lib/format-uzs";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusUz(s: string): string {
  const m: Record<string, string> = {
    TEACHER_INVITE_DRAFT: "O‘qituvchi yubora olmoqchi — tuzatish kutilmoqda",
    AWAITING_STUDENT: "Siz tasdiqlaysiz · sinf azosi bo‘ling",
    AWAITING_TEACHER: "O‘qituvchi javobini kutyapmiz",
    ACTIVE: "Faol azo — testlar chiqadi pastda",
    DECLINED: "Rad etildi",
  };
  return m[s] ?? s;
}

function joinBanner(q: Record<string, string | string[] | undefined>): string | null {
  const g = (k: string) => {
    const v = q[k];
    return typeof v === "string" ? v : undefined;
  };
  const err = g("joinErr");
  const hint = g("joinHint");

  const errMap: Record<string, string> = {
    phone: "Jonlanish uchun telefon noto‘g‘ri.",
    no_teacher: "O‘qituvchi topilmadi.",
    no_class: "Sinf topilmadi.",
    invite_use_confirm: "Bu sinfda o‘qituvchi taklifi kutilyapti — pastdagi tasdiqnidan foydalaning.",
    bad_accept: "Tasdiqlab bo‘lmadi — holat boshqa.",
    bad_decline: "Rad etib bo‘lmadi — sahifani yangilang.",
    unknown: "Kutilmagan xato.",
  };
  if (err && errMap[err]) return errMap[err];

  const hintMap: Record<string, string> = {
    already_active: "Siz bu sinfda allaqachon faolsiz.",
    request_pending: "So‘rov yuborilgan — o‘qituvchi javobini kutishda.",
    teacher_drafting: "O‘qituvchi siz uchun taklifni tayyorlayapti · biroz kuting.",
    request_sent: "So‘rov jo‘natildi.",
    joined: "Sinfga qabul qilindingiz!",
    you_declined: "Rad qildingiz.",
    marked_seen: "Yangi belgilar olib tashlandi — barcha yangiliklarni ko‘rgansiz.",
  };
  if (hint && hintMap[hint]) return hintMap[hint];

  return null;
}

export default async function VirtualSinflarPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await props.searchParams;
  const banner = joinBanner(q);

  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (student.appUserRole === "TEACHER_PENDING" || student.appUserRole === "TEACHER") {
    redirect(TEACHER_LOGIN_HOME);
  }
  if (!isStudentProfileComplete(student)) redirect("/auth/profilni-toldirish");

  const mine = await prisma.virtualClassMember.findMany({
    where: { studentUserId: student.id },
    include: {
      virtualClass: {
        include: {
          teacher: {
            select: {
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedTests: {
            select: {
              id: true,
              createdAt: true,
              test: { select: { id: true, title: true, durationMinutes: true, priceSum: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalNew = mine.reduce((sum, m) => sum + countStudentMemberNews(m), 0);

  const statusOrder: Record<string, number> = {
    AWAITING_STUDENT: 0,
    TEACHER_INVITE_DRAFT: 1,
    AWAITING_TEACHER: 2,
    ACTIVE: 3,
    DECLINED: 4,
  };
  mine.sort((a, b) => {
    const da = statusOrder[a.status] ?? 99;
    const db = statusOrder[b.status] ?? 99;
    if (da !== db) return da - db;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const activeIds = mine.filter((x) => x.status === "ACTIVE").map((x) => x.virtualClassId);

  let completedAttempts: { testId: string }[] = [];
  const allAssignedTestIds = [
    ...new Set(
      mine.flatMap((m) => m.virtualClass.assignedTests.map((a) => a.test.id)),
    ),
  ];
  if (allAssignedTestIds.length > 0) {
    completedAttempts = await prisma.testAttempt.findMany({
      where: { userId: student.id, testId: { in: allAssignedTestIds } },
      select: { testId: true },
    });
  }
  const doneSet = new Set(completedAttempts.map((a) => a.testId));

  const leaderboardByClassId = new Map<string, ReturnType<typeof virtualClassLbToLeaderboardRows>>();
  if (activeIds.length > 0) {
    const lbResults = await Promise.all(
      activeIds.map(async (classId) => ({
        classId,
        rows: virtualClassLbToLeaderboardRows(await getVirtualClassLeaderboard(classId)),
      })),
    );
    for (const { classId, rows } of lbResults) {
      leaderboardByClassId.set(classId, rows);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-[max(1rem,env(safe-area-inset-left))] py-10 pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="text-center lg:text-left">
        <Link href="/kabinet" className="text-sm font-medium text-blue-700 hover:text-blue-900">
          ← Kabinet
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Virtual sinflar</h1>
          {totalNew > 0 ? <NewsStatusBadge isRead={false} /> : null}
        </div>
      </div>

      {totalNew > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-950">
            <strong className="font-bold">{totalNew}</strong> ta yangilik: yangi testlar yoki o‘qituvchi taklifi.
          </p>
          <form action={markStudentVirtualSinflarSeenAction}>
            <button
              type="submit"
              className="rounded-lg bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900"
            >
              Hammasini ko‘rdim
            </button>
          </form>
        </div>
      ) : null}

      {banner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200/70">
          {banner}
        </div>
      ) : null}

      <JoinVirtualClassSection />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Sinflaringiz va holatlari</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Hali hech bir sinfda emassiz · yuqorida qoʻshilish soʻrovi berishingiz mumkin.</p>
        ) : (
          <ul className="mt-4 space-y-6 divide-y divide-slate-100">
            {mine.map((m) => {
              const c = m.virtualClass;
              const classHasNew = studentMemberHasNews(m);
              const t = c.teacher;
              const teacherLabel =
                studentDisplayName({
                  firstName: t.firstName,
                  lastName: t.lastName,
                  parentPhone: "",
                  gradeLevel: 0,
                }).trim()
                || formatPhoneDisplay(t.phone);
              const lbRows = leaderboardByClassId.get(c.id) ?? [];

              return (
                <li key={m.id} className="pt-4 first:pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-900">
                        {c.courseName}
                        {classHasNew ? <NewsStatusBadge isRead={false} /> : null}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-700">Markaz:</span> {c.tuman}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Oʻqituvchi:{" "}
                        <span className="font-semibold text-slate-700">{teacherLabel}</span> · tel:{" "}
                        {formatPhoneDisplay(t.phone)}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-700">
                        {statusUz(m.status)}
                        {m.status === "AWAITING_STUDENT" &&
                        isVirtualActivityNew(m.updatedAt, m.studentActivitySeenAt) ? (
                          <NewsStatusBadge isRead={false} />
                        ) : null}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-slate-600">
                        {m.initiatedBy === "TEACHER" ? (
                          <>
                            Oqim: <span className="font-medium text-slate-800">o‘qituvchi taklifi</span> — siz tasdiqlasangiz
                            sinfga kirasiz.
                          </>
                        ) : (
                          <>
                            Oqim: <span className="font-medium text-slate-800">siz tanlagan sinf</span> uchun so‘rov — o‘qituvchi
                            shu sinf kabinetida tasdiqlasa, sinfga kirasiz.
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.status === "AWAITING_STUDENT" ? (
                        <>
                          <form action={studentAcceptTeacherInvite}>
                            <input type="hidden" name="memberId" value={m.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                            >
                              Sinfdaman — tasdiqlayman
                            </button>
                          </form>
                          <form action={studentDeclineMembership}>
                            <input type="hidden" name="memberId" value={m.id} />
                            <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                              Rad qilish
                            </button>
                          </form>
                        </>
                      ) : null}
                      {m.status === "AWAITING_TEACHER" ? (
                        <div className="w-full space-y-2 sm:w-auto sm:text-right">
                          <p className="text-sm text-slate-600">
                            O‘qituvchi sinfga qabul qilguncha kuting — qabul qilingach shu yerda testlar
                            ochiladi.
                          </p>
                          <form action={studentDeclineMembership} className="inline">
                            <input type="hidden" name="memberId" value={m.id} />
                            <button
                              type="submit"
                              className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
                            >
                              So‘rovni bekor qilish
                            </button>
                          </form>
                        </div>
                      ) : null}
                      {m.status === "TEACHER_INVITE_DRAFT" ? (
                        <div className="w-full space-y-2 sm:w-auto sm:text-right">
                          <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                            Bu yozuv eski “qoralama” holatida qolgan bo‘lishi mumkin. O‘qituvchidan shu sinfda taklifni
                            qayta yuborishni so‘rang yoki «So‘rovni tasdiqlang» (o‘qituvchi tomonida) bosilishini — so‘ng
                            bu yerda «Sinfdaman — tasdiqlayman» paydo bo‘ladi.
                          </p>
                          <form action={studentDeclineMembership} className="inline">
                            <input type="hidden" name="memberId" value={m.id} />
                            <button
                              type="submit"
                              className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
                            >
                              Bekor qilish
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {m.status === "ACTIVE" && c.assignedTests.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Sinfdagi testlar</h3>
                      <ul className="mt-2 space-y-2">
                        {c.assignedTests.map((a) => {
                          const done = doneSet.has(a.test.id);
                          const testIsNew =
                            m.status === "ACTIVE" &&
                            isVirtualActivityNew(a.createdAt, m.studentActivitySeenAt);
                          const priceLabel =
                            a.test.priceSum > 0 ? formatPriceSum(a.test.priceSum) : "Bepul";
                          return (
                          <li
                            key={a.id}
                            className={cn(
                              "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2",
                              testIsNew
                                ? "border-amber-200/90 bg-amber-50/50"
                                : "border-slate-100 bg-white",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                                {a.test.title}
                                {testIsNew ? <NewsStatusBadge isRead={false} /> : null}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-600">
                                {a.test.durationMinutes} daq ·{" "}
                                <span
                                  className={
                                    a.test.priceSum > 0 ? "font-semibold text-emerald-800" : undefined
                                  }
                                >
                                  {priceLabel}
                                </span>
                                {done && a.test.priceSum > 0 ? (
                                  <span className="text-slate-500"> · qayta yechish bepul</span>
                                ) : !done && a.test.priceSum > 0 ? (
                                  <span className="text-slate-500">
                                    {" "}
                                    · balansdan yechiladi
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            {done ? (
                              <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-900">
                                Topshirildi
                              </span>
                            ) : (
                              <Link
                                href={`/testlar/${a.test.id}/boshlash`}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Testni boshlash
                              </Link>
                            )}
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {m.status === "ACTIVE" ? (
                    <div className="mt-5">
                      <LeaderboardBoardTable
                        rows={lbRows}
                        currentUserId={student.id}
                        title={`${c.courseName} — Leaderboard`}
                        subtitle="Shu sinfga biriktirilgan testlar bo‘yicha rank ball · faqat faol o‘quvchilar"
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
