import type { TestCatalogCategory } from "@prisma/client";

export const TEST_CATALOG_ORDER: readonly TestCatalogCategory[] = [
  "MOCK",
  "MATHEMATICS",
  "CRITICAL_LOGIC",
  "ENGLISH",
] as const;

export function isTestCatalogCategory(v: string): v is TestCatalogCategory {
  return (TEST_CATALOG_ORDER as readonly string[]).includes(v);
}

export function normalizeTestCatalogCategory(v: string): TestCatalogCategory {
  return isTestCatalogCategory(v) ? v : "MATHEMATICS";
}

/** Admin jadval va forma select */
export const CATALOG_LABEL_ADMIN: Record<TestCatalogCategory, string> = {
  MOCK: "Mock testlar",
  MATHEMATICS: "Matematikadan testlar",
  CRITICAL_LOGIC: "Tanqidiy va mantiqiy",
  ENGLISH: "Ingliz tili",
};

/** Kabinet / umumiy katalog — standart talablar (tavsif) */
export const CATALOG_SECTION_META: Record<
  TestCatalogCategory,
  { heading: string; subtitle: string }
> = {
  MOCK: {
    heading: "Mock testlar",
    subtitle: "Rasmiy formatga yaqin sinov testlari.",
  },
  MATHEMATICS: {
    heading: "Matematikadan testlar",
    subtitle: "Standart: 30 ta savol · 30 ball · 60 daqiqa.",
  },
  CRITICAL_LOGIC: {
    heading: "Tanqidiy va mantiqiy savollar",
    subtitle: "Standart: 40 ta savol · 80 ball · 70 daqiqa.",
  },
  ENGLISH: {
    heading: "Ingliz tili",
    subtitle: "Standart: 40 ta savol · 40 ball · 40 daqiqa.",
  },
};

/** Kabinet katalog kartochkalari — bo‘lim bo‘yicha accent */
export const CATALOG_PANEL_PREMIUM: Record<
  TestCatalogCategory,
  {
    header: string;
    orb: string;
    chipBorder: string;
    /** Test kartochkasi chap chetidagi nozik chiziq */
    cardBar: string;
  }
> = {
  MOCK: {
    header: "bg-gradient-to-br from-sky-500/18 via-white to-cyan-400/10",
    orb: "bg-sky-400/30",
    chipBorder: "border-sky-200/70 bg-sky-50/60 text-slate-700",
    cardBar: "border-l-[3px] border-l-sky-500/85",
  },
  MATHEMATICS: {
    header: "bg-gradient-to-br from-violet-500/18 via-white to-fuchsia-500/10",
    orb: "bg-violet-400/25",
    chipBorder: "border-violet-200/70 bg-violet-50/60 text-slate-700",
    cardBar: "border-l-[3px] border-l-violet-500/85",
  },
  CRITICAL_LOGIC: {
    header: "bg-gradient-to-br from-amber-500/18 via-white to-orange-400/10",
    orb: "bg-amber-400/25",
    chipBorder: "border-amber-200/70 bg-amber-50/60 text-slate-700",
    cardBar: "border-l-[3px] border-l-amber-500/85",
  },
  ENGLISH: {
    header: "bg-gradient-to-br from-emerald-500/18 via-white to-teal-400/10",
    orb: "bg-emerald-400/25",
    chipBorder: "border-emerald-200/70 bg-emerald-50/60 text-slate-700",
    cardBar: "border-l-[3px] border-l-emerald-600/85",
  },
};

/** Radar diagramma: har doim shu tartibdagi o‘qlar (kabinet). */
export const RADAR_AXIS_LABELS: Record<TestCatalogCategory, string> = {
  MOCK: "Mock Test",
  MATHEMATICS: "Matematikadan",
  CRITICAL_LOGIC: "Tanqidiy va mantiqiy savollar",
  ENGLISH: "Ingliz tili",
};

/** Kabinet katalog «menyusi»: har bo'limda eng ko'pi bilan shuncha test. */
export const CATALOG_MENU_MAX = 3;

/** Kabinet katalogida: eng yangi (createdAt) testlar ro'yxat boshida. */
export function pickLatestTestsForCatalogMenu<T extends { createdAt: string | Date }>(
  items: T[],
  max: number = CATALOG_MENU_MAX,
): T[] {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return sorted.slice(0, max);
}
