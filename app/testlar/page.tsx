import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStudentSessionUserId } from "@/lib/student-auth";
import { PublicTestCatalogList } from "@/components/test-catalog/PublicTestCatalogList";
import {
  TEST_CATALOG_ORDER,
  normalizeTestCatalogCategory,
} from "@/lib/test-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Testlar — Prezident Test",
  description: "Nashr etilgan testlar ro'yxati.",
};

export default async function TestsPublicPage() {
  const [items, userId] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { questions: true } } },
    }),
    getStudentSessionUserId(),
  ]);

  const completedIds = new Set<string>();
  if (userId && items.length > 0) {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId, testId: { in: items.map((t) => t.id) } },
      select: { testId: true },
    });
    for (const a of attempts) completedIds.add(a.testId);
  }

  const buckets: Record<string, typeof items> = {
    MOCK: [],
    MATHEMATICS: [],
    CRITICAL_LOGIC: [],
    ENGLISH: [],
  };
  for (const t of items) {
    const c = normalizeTestCatalogCategory(t.catalogCategory);
    buckets[c].push(t);
  }

  const defaultOpenCategory =
    TEST_CATALOG_ORDER.find((c) => (buckets[c]?.length ?? 0) > 0) ?? TEST_CATALOG_ORDER[0];

  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-gradient-to-b from-sky-50/80 via-white to-teal-50/20">
      <header className="w-full min-w-0 overflow-x-clip border-b border-slate-200/80 bg-white/90 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex h-14 w-full min-w-0 max-w-5xl items-center justify-between gap-2 pad-x-page sm:h-16">
          <div className="flex min-h-11 min-w-0 items-center gap-2 py-1 font-semibold text-slate-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
            <span className="truncate">Testlar</span>
          </div>
          <Link
            href="/kabinet"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-blue-600 hover:bg-sky-50 hover:text-blue-700 active:bg-sky-100"
          >
            Kabinet
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-5xl pad-x-page py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-14">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Testlar katalogi</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Nashr etilgan testlar bo&apos;limlarga bo&apos;lingan. Sarlavhani bosing — ochiladi yoki yopiladi; yonida shu
          bo&apos;limda <strong>nechta test</strong> borligi ko&apos;rsatiladi.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Ro&apos;yxatdan o&apos;tgan o&apos;quvchilar testlarni{" "}
          <Link href="/kabinet" className="font-medium text-blue-600 hover:text-blue-700">
            shaxsiy kabinet
          </Link>{" "}
          orqali ham kuzatadi.
          {userId ? (
            <>
              {" "}
              Siz yechib bo&apos;lgan testlar yashil belgi bilan ko&apos;rsatiladi.
            </>
          ) : null}
        </p>
        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500 shadow-sm">
            Hozircha nashr etilgan testlar yo&apos;q.
          </div>
        ) : (
          <PublicTestCatalogList
            sections={TEST_CATALOG_ORDER.map((cat) => ({
              cat,
              items: buckets[cat] ?? [],
            }))}
            defaultOpenCategory={defaultOpenCategory}
            completedIds={[...completedIds]}
          />
        )}
      </main>
    </div>
  );
}
