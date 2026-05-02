/**
 * Reyting balli: to‘g‘ri javoblar ulushi (asosiy) + vaqtga qarab bonus (tezroq = ko‘proq).
 * Natija butun son — barcha testlar bo‘yicha yig‘indida ishlatiladi.
 */
export function computeRankPoints(
  score: number,
  total: number,
  secondsUsed: number | null,
  durationMinutes: number,
): number {
  if (total <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, score / total));
  const base = Math.round(ratio * 1000);

  const allocated = Math.max(120, durationMinutes * 60);
  const usedRaw = secondsUsed ?? allocated;
  const used = Math.min(usedRaw, allocated + 180);
  const saved = Math.max(0, allocated - used);
  const speedBonus = Math.round((saved / allocated) * 350);

  return Math.max(0, base + speedBonus);
}
