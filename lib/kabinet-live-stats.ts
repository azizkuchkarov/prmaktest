import type { TestCatalogCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATALOG_SECTION_META, TEST_CATALOG_ORDER, normalizeTestCatalogCategory } from "@/lib/test-catalog";
import type { KabinetLiveStatsPayload } from "@/lib/kabinet-live-stats.types";

/**
 * Kabinetda ko‘rsatishda real sonlarga qo‘shiladi (ijtimoiy ishonch / marketing).
 * Kerak bo‘lsa keyinroq .env ga chiqarish mumkin.
 */
export const KABINET_STATS_TOTAL_USERS_OFFSET = 100;
export const KABINET_STATS_ACTIVE_TEST_OFFSET = 10;
/** Har bir yo‘nalish (katalog bo‘limi) uchun ko‘rsatishdagi qo‘shimcha (marketing). */
export const KABINET_STATS_CATEGORY_ACTIVE_OFFSET = 15;

/**
 * Faqat aktiv deb hisoblanadi: `TestProgress.endsAt > now` (test yechilayotgan o'quvchi).
 * Har kabinet ochilishida 2 ta yengil so'rov — WebSocket / heartbeat yo'q.
 */
export async function getKabinetLiveStatsForDisplay(): Promise<KabinetLiveStatsPayload> {
  const now = new Date();

  const [userCount, progresses] = await Promise.all([
    prisma.user.count(),
    prisma.testProgress.findMany({
      where: { endsAt: { gt: now } },
      select: {
        userId: true,
        test: { select: { catalogCategory: true } },
      },
    }),
  ]);

  const activeUsersTotal = new Set(progresses.map((p) => p.userId));
  const perCat = new Map<TestCatalogCategory, Set<string>>();
  for (const c of TEST_CATALOG_ORDER) {
    perCat.set(c, new Set());
  }
  for (const p of progresses) {
    const cat = normalizeTestCatalogCategory(String(p.test.catalogCategory));
    perCat.get(cat)?.add(p.userId);
  }

  const byCategory = TEST_CATALOG_ORDER.map((category) => ({
    category,
    label: CATALOG_SECTION_META[category].heading,
    activeNow: (perCat.get(category)?.size ?? 0) + KABINET_STATS_CATEGORY_ACTIVE_OFFSET,
  }));

  return {
    totalUsersDisplay: userCount + KABINET_STATS_TOTAL_USERS_OFFSET,
    activeTestTakersDisplay: activeUsersTotal.size + KABINET_STATS_ACTIVE_TEST_OFFSET,
    byCategory,
  };
}
