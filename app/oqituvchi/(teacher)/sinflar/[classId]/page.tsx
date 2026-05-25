import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ExamSchoolProgram, ExamTargetCohort, SpecializedSixTrack, TestCatalogCategory } from "@prisma/client";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  ChevronRight,
  Smartphone,
  Trophy,
  Users,
  UserPlus,
} from "lucide-react";
import {
  teacherApproveStudentRequest,
  teacherConfirmOwnInviteDraft,
  teacherDeclineMembership,
  inviteStudentByPhone,
  assignCatalogTest,
  markTeacherClassActivitySeenAction,
  unassignCatalogTest,
} from "@/app/oqituvchi/(teacher)/actions";
import { NewsStatusBadge } from "@/components/news/NewsStatusBadge";
import { countTeacherClassPendingNews, isVirtualActivityNew } from "@/lib/virtual-class-new";
import { prisma } from "@/lib/prisma";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { formatPhoneDisplay } from "@/lib/phone";
import { getVirtualClassLeaderboard } from "@/lib/virtual-class-leaderboard";
import {
  virtualClassPrepGradeLabel,
  virtualClassTestVisibleForPrepGrade,
} from "@/lib/virtual-class-prep-grade";
import type { CatalogTestRowModel } from "@/lib/build-exam-catalog-sections";
import { buildProgramCatalogGroups, pickDefaultOpenProgram } from "@/lib/build-exam-catalog-sections";
import { KabinetProgramsCatalog } from "@/components/kabinet/KabinetProgramsCatalog";
import { catalogModelToKabinetRow } from "@/lib/catalog-model-to-kabinet-row";
import { KabinetCatalogTestRow } from "@/components/kabinet/KabinetCatalogTestRow";
import { normalizeTestCatalogCategory } from "@/lib/test-catalog";
import { LeaderboardBoardTable } from "@/components/kabinet/LeaderboardBoardTable";
import type { LeaderboardRow } from "@/lib/student-ranking";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

function bannerForQuery(q: Record<string, string | undefined>): string | null {
  const hints: Record<string, string> = {
    created: "Virtual sinf yaratildi.",
    draft_ok:
      "Eski yozuv: pastdagi «So‘rovni tasdiqlang» ni bosing yoki taklifni qayta yuboring — o‘quvchiga «Sinfdaman — tasdiqlayman» chiqadi.",
    invite_sent: "Taklif yuborildi — o‘quvchi kabinetida «Sinfdaman — tasdiqlayman» tugmasidan javob beradi.",
    invite_pending: "Bu o‘quvchi allaqachon tasdiqqa jo‘natilgan.",
    request_ok: "O‘quvchi sinfda faol azo bo‘ldi.",
    declined: "A‘zolik rad etildi.",
    test_assigned: "Test sinfga biriktirildi.",
    test_removed: "Test sinfdan yechildi.",
    activity_seen: "Yangi so‘rovlar ko‘rilgan deb belgilandi.",
  };
  if (q.hint && hints[q.hint]) return hints[q.hint];
  const invErrors: Record<string, string> = {
    phone: "Telefon noto‘g‘ri yozilgan.",
    self: "O‘zingizni qo‘sholmaysiz.",
    not_student: "Bu raqamda STUDENT akkaunt yo‘q (yoki o‘qituvchi akkaunt).",
    active: "O‘quvchi allaqachon bu sinfda.",
    request_exists: "O‘quvchi allaqachon «sinfka qo‘shish» so‘rovi yuborgan — tasdiqlang yoki rad eting.",
    no_draft: "Bu a‘zo uchun javob yozish vaqti tugagan yoki boshqa holat.",
    bad_state: "Holat bilan mos kelmaydi — sahifani yangilang.",
    unknown: "Kutilmagan xatolik — qaytadan urining.",
  };
  if (q.invErr && invErrors[q.invErr]) return invErrors[q.invErr];
  if (q.testErr === "not_found") return "Tanlangan test topilmadi.";
  return null;
}

function statusUz(s: string): string {
  const m: Record<string, string> = {
    TEACHER_INVITE_DRAFT: "O‘qituvchi tasdig‘ini kutadi",
    AWAITING_STUDENT: "O‘quvchi tasdig‘ini kutadi",
    AWAITING_TEACHER: "O‘quvchi so‘rovi · siz tasdiqlaysiz",
    ACTIVE: "Faol azo",
    DECLINED: "Rad etilgan",
  };
  return m[s] ?? s;
}

const pane =
  "rounded-[1.5rem] border border-white/80 bg-white/80 p-6 shadow-xl shadow-indigo-950/[0.04] backdrop-blur-sm ring-1 ring-slate-200/55 sm:p-7";

type TeacherCatalogTestDb = {
  id: string;
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  priceSum: number;
  questionsCount: number;
  catalogCategory: TestCatalogCategory;
  createdAt: Date;
  examSchoolProgram: ExamSchoolProgram;
  examTargetCohort: ExamTargetCohort;
  specializedSixTrack: SpecializedSixTrack;
};

function testDbToCatalogRow(t: TeacherCatalogTestDb, completed = false): CatalogTestRowModel {
  return {
    id: t.id,
    title: t.title,
    catalogCategory: t.catalogCategory,
    subject: t.subject,
    description: t.description,
    durationMinutes: t.durationMinutes,
    priceSum: t.priceSum,
    createdAt: t.createdAt,
    _count: { questions: t.questionsCount },
    examSchoolProgram: t.examSchoolProgram,
    examTargetCohort: t.examTargetCohort,
    specializedSixTrack: t.specializedSixTrack,
    completed,
  };
}

export default async function VirtualClassTeacherPage(props: Props) {
  const { classId } = await props.params;
  const q = await props.searchParams;

  const sessionId = await getStudentSessionUserId();
  if (!sessionId) redirect("/auth/kirish");

  const me = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { appUserRole: true },
  });
  if (me?.appUserRole !== "TEACHER") redirect("/auth/kirish");

  const cls = await prisma.virtualClass.findFirst({
    where: { id: classId, teacherUserId: sessionId },
    include: {
      members: {
        orderBy: { updatedAt: "desc" },
        include: {
          student: {
            select: {
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      assignedTests: {
        include: {
          test: {
            select: {
              id: true,
              title: true,
              subject: true,
              description: true,
              durationMinutes: true,
              priceSum: true,
              questionsCount: true,
              catalogCategory: true,
              createdAt: true,
              examSchoolProgram: true,
              examTargetCohort: true,
              specializedSixTrack: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) notFound();

  const classPendingNew = countTeacherClassPendingNews({
    id: cls.id,
    teacherActivitySeenAt: cls.teacherActivitySeenAt,
    members: cls.members,
  });

  const leaderboard = await getVirtualClassLeaderboard(cls.id);

  const assignedIds = new Set(cls.assignedTests.map((a) => a.test.id));
  const catalogTestsRawAll = await prisma.test.findMany({
    where: {
      isPublished: true,
      isTournamentOnly: false,
      ...(assignedIds.size > 0 ? { id: { notIn: [...assignedIds] as string[] } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      subject: true,
      description: true,
      durationMinutes: true,
      priceSum: true,
      questionsCount: true,
      catalogCategory: true,
      createdAt: true,
      examSchoolProgram: true,
      examTargetCohort: true,
      specializedSixTrack: true,
    },
    take: 400,
  });

  const catalogTestsRaw = catalogTestsRawAll.filter((t) =>
    virtualClassTestVisibleForPrepGrade(t, cls.prepGradeLevel),
  );

  const catalogRows = catalogTestsRaw.map((t) =>
    testDbToCatalogRow(t as TeacherCatalogTestDb, false),
  );
  const programCatalogGroups = buildProgramCatalogGroups(catalogRows, cls.prepGradeLevel);
  const defaultOpenProgram = pickDefaultOpenProgram(programCatalogGroups);

  const secondaryActionByTestId = Object.fromEntries(
    catalogRows.map((row) => [
      row.id,
      <form key={row.id} action={assignCatalogTest} className="inline-flex w-full min-[400px]:w-auto">
        <input type="hidden" name="virtualClassId" value={cls.id} />
        <input type="hidden" name="testId" value={row.id} />
        <button
          type="submit"
          className="inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-[11px] font-bold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-105 min-[400px]:w-auto"
        >
          Sinfga biriktirish
          <ArrowRight className="h-3.5 w-3.5 opacity-90" aria-hidden />
        </button>
      </form>,
    ]),
  ) as Record<string, ReactNode>;

  const leaderboardTableRows: LeaderboardRow[] = leaderboard.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: r.displayName,
    viloyat: r.viloyat.trim() !== "" ? r.viloyat : "—",
    points: r.totalRankPoints,
  }));

  const banner = bannerForQuery(q);
  const activeCount = cls.members.filter((x) => x.status === "ACTIVE").length;
  const pipelineCount = cls.members.filter((x) =>
    ["TEACHER_INVITE_DRAFT", "AWAITING_STUDENT", "AWAITING_TEACHER"].includes(x.status),
  ).length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <nav aria-label="Navigatsiya zanjiri" className="flex flex-wrap items-center gap-1 text-[13px] font-medium">
        <Link
          href="/oqituvchi/sinfxonalar"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/70 px-3 py-1.5 text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-white hover:text-indigo-900"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Sinfxonalar
        </Link>
        <ChevronRight className="size-4 text-slate-300" aria-hidden />
        <span className="truncate text-slate-500">{cls.courseName}</span>
      </nav>

      {banner ? (
        <div className="rounded-2xl border border-teal-200/85 bg-gradient-to-r from-teal-50 via-white to-white px-5 py-3.5 text-sm font-medium text-teal-950 ring-1 ring-teal-200/70 shadow-sm shadow-teal-900/10">
          {banner}
        </div>
      ) : null}

      {classPendingNew > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-950">
            <strong className="font-bold">{classPendingNew}</strong> ta yangi o‘quvchi sinfga qo‘shilish so‘rovi.
          </p>
          <form action={markTeacherClassActivitySeenAction}>
            <input type="hidden" name="virtualClassId" value={cls.id} />
            <button
              type="submit"
              className="rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900"
            >
              Hammasini ko‘rdim
            </button>
          </form>
        </div>
      ) : null}

      <header className="relative overflow-hidden rounded-[1.65rem] border border-white/90 bg-gradient-to-br from-[#312e81] via-indigo-700 to-teal-700 p-[1px] shadow-2xl shadow-indigo-900/35">
        <div className="rounded-[calc(1.65rem-1px)] px-8 py-10 text-white">
          <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-white/15 blur-[100px]" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-200/95">Virtual sinf xonasi</p>
              <h1 className="mt-4 text-[1.7rem] font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2.1rem]">
                {cls.courseName}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[15px] text-indigo-100/95">
                <span className="inline-block size-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                Markaz: {cls.tuman}
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-teal-100 ring-1 ring-white/25">
                  {virtualClassPrepGradeLabel(cls.prepGradeLevel)}
                </span>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
              <div className="rounded-2xl border border-white/25 bg-black/20 px-4 py-3 backdrop-blur-md">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-100/90">
                  <Users className="size-3.5" aria-hidden /> Faol
                </dt>
                <dd className="mt-2 text-2xl font-black tabular-nums">{activeCount}</dd>
              </div>
              <div className="rounded-2xl border border-white/25 bg-black/20 px-4 py-3 backdrop-blur-md">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-100/95">
                  <UserPlus className="size-3.5" aria-hidden /> Jarayonda
                </dt>
                <dd className="mt-2 text-2xl font-black tabular-nums">{pipelineCount}</dd>
              </div>
              <div className="rounded-2xl border border-white/25 bg-black/20 px-4 py-3 backdrop-blur-md sm:col-span-1">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-teal-100">
                  <BookOpenCheck className="size-3.5" aria-hidden /> Testlar
                </dt>
                <dd className="mt-2 text-2xl font-black tabular-nums">{cls.assignedTests.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <section className={pane}>
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
            <Smartphone className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Taklif yuborish</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Mobil raqam bilan — o‘quvchi kabinetidagi «Virtual sinflar» bo‘limida javob beradi va sinfaga kiradi.
            </p>
            <form action={inviteStudentByPhone} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
              <input type="hidden" name="virtualClassId" value={cls.id} />
              <input
                name="studentPhone"
                type="tel"
                required
                placeholder="+998 90 123 45 67"
                className="min-h-12 flex-1 rounded-2xl border border-slate-200/95 bg-white/95 px-4 text-[15px] outline-none shadow-inner ring-2 ring-transparent transition focus:border-indigo-400 focus:ring-indigo-100 sm:max-w-xs"
              />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-[14px] font-bold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 active:scale-[0.99]"
              >
                Taklifni yuborish
                <ArrowRight className="size-4 opacity-95" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className={pane}>
        <div className="border-b border-slate-100/90 pb-5">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-lg shadow-violet-500/30">
              <Users className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">A‘zolar va so‘rovlar</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                <strong>Taklif</strong> — o‘quvchi kabinetidan tasdiqlanadi.
                <strong> O‘quvchi so‘rovi</strong> — tanlaganlari shu sinf uchun; «Qabul qilish» bilan rostdan aktivlashtirasiz.
                Bir nechta sinfi bo‘lsa, har sinf uchun alohida.
              </p>
            </div>
          </div>
        </div>
        {cls.members.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">Bu xona hali boʻsh · taklif yuboring yoki kuting.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {cls.members.map((m) => {
              const s = m.student;
              const name =
                `${s.firstName?.trim()} ${s.lastName?.trim()}`.trim() || formatPhoneDisplay(s.phone);
              const memberIsNew =
                m.status === "AWAITING_TEACHER" &&
                isVirtualActivityNew(m.updatedAt, cls.teacherActivitySeenAt);
              return (
                <li key={m.id}>
                  <div
                    className={cn(
                      "flex flex-col gap-4 rounded-2xl border p-5 ring-1 sm:flex-row sm:items-start sm:justify-between",
                      memberIsNew
                        ? "border-amber-200/90 bg-amber-50/40 ring-amber-100/90"
                        : "border-slate-100/95 bg-gradient-to-b from-white to-slate-50/40 ring-slate-100/90",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-slate-900">{name}</p>
                      <p className="truncate text-xs font-medium tabular-nums text-slate-500">{formatPhoneDisplay(s.phone)}</p>
                      <div className="mt-3 inline-flex flex-wrap gap-2">
                        <span className="rounded-full bg-violet-100/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-900 ring-1 ring-violet-200/80">
                          {statusUz(m.status)}
                        </span>
                        {memberIsNew ? <NewsStatusBadge isRead={false} /> : null}
                      </div>
                      <p className="mt-2 text-[11px] leading-snug text-slate-600">
                        {m.initiatedBy === "TEACHER" ? (
                          <>
                            Oqim: <span className="font-semibold text-slate-800">siz taklif</span> yubordingiz · o‘quvchi
                            tasdiqlagach aktiv.
                          </>
                        ) : (
                          <>
                            Oqim: <span className="font-semibold text-slate-800">o‘quvchi</span> aynan shu sinfni tanlagan —
                            «Qabul qilish» kutilyapti.
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {m.status === "TEACHER_INVITE_DRAFT" ? (
                        <form action={teacherConfirmOwnInviteDraft}>
                          <input type="hidden" name="virtualClassId" value={cls.id} />
                          <input type="hidden" name="memberId" value={m.id} />
                          <button
                            type="submit"
                            className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-teal-600/30 transition hover:bg-teal-700"
                          >
                            So‘rovni tasdiqlang
                          </button>
                        </form>
                      ) : null}
                      {m.status === "AWAITING_TEACHER" ? (
                        <>
                          <form action={teacherApproveStudentRequest}>
                            <input type="hidden" name="virtualClassId" value={cls.id} />
                            <input type="hidden" name="memberId" value={m.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-teal-600/30 hover:bg-teal-700"
                            >
                              Qabul qilish
                            </button>
                          </form>
                          <form action={teacherDeclineMembership}>
                            <input type="hidden" name="virtualClassId" value={cls.id} />
                            <input type="hidden" name="memberId" value={m.id} />
                            <button
                              type="submit"
                              className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
                            >
                              Rad etish
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={pane}>
        <div className="flex items-start gap-4 border-b border-slate-100/90 pb-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/35">
            <BookOpenCheck className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Testlar va katalog</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Faqat <strong className="text-slate-800">{virtualClassPrepGradeLabel(cls.prepGradeLevel)}</strong> uchun
              mos testlar — kabinetdagidek maktab dasturi va fan bo‘limlari. Kerakli testda{" "}
              <strong className="text-slate-800">«Sinfga biriktirish»</strong> ni bosing.
            </p>
          </div>
        </div>

        {catalogRows.length === 0 ? (
          <p className="mt-5 text-[14px] text-slate-500">
            Bu sinf bloki ({virtualClassPrepGradeLabel(cls.prepGradeLevel)}) uchun qo‘shib bo‘ladigan testlar yo‘q — barchasi
            biriktirilgan yoki admin hali shu blokda test joylamagan.
          </p>
        ) : (
          <div className="relative mt-6">
            <KabinetProgramsCatalog
              groups={programCatalogGroups}
              defaultOpenProgram={defaultOpenProgram}
              secondaryActionByTestId={secondaryActionByTestId}
            />
          </div>
        )}

        {cls.assignedTests.length > 0 ? (
          <div className="mt-10 border-t border-slate-200/80 pt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Shu sinfga biriktirilgan</p>
            <ul className="mt-5 space-y-3">
              {cls.assignedTests.map((a) => {
                const row = testDbToCatalogRow(a.test as TeacherCatalogTestDb, false);
                const kt = catalogModelToKabinetRow(row);
                const nc = normalizeTestCatalogCategory(String(row.catalogCategory ?? "MATHEMATICS"));
                return (
                  <KabinetCatalogTestRow
                    key={a.id}
                    test={kt}
                    category={nc}
                    secondaryAction={
                      <form action={unassignCatalogTest} className="inline-flex w-full min-[400px]:w-auto">
                        <input type="hidden" name="virtualClassId" value={cls.id} />
                        <input type="hidden" name="assignmentId" value={a.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-[11px] font-bold text-rose-800 transition hover:bg-rose-100 min-[400px]:w-auto"
                        >
                          Olib tashlash
                        </button>
                      </form>
                    }
                  />
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className={pane}>
        <div className="flex items-start gap-4 border-b border-slate-100/90 pb-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-orange-500/35">
            <Trophy className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Leaderboard</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Kabinetdagi jadval bilan bir xil — o‘rin (🥇🥈🥉), ism, viloyat va rank ball · faqat faol o‘quvchilar va
              shu sinfga biriktirilgan testlar.
            </p>
          </div>
        </div>
        <LeaderboardBoardTable
          rows={leaderboardTableRows}
          title={`${cls.courseName} — TOP`}
          subtitle="Biriktirilgan testlar bo‘yicha yig‘ilgan reyting ballari · tenglar: kamroq vaqt yuqoriroq."
        />
      </section>
    </div>
  );
}
