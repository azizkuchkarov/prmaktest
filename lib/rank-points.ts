/**
 * Reyting balli (har bir urinish uchun):
 * - Asosiy: to‘g‘ri javoblar ulushi — maks. 60 ball (masalan 30/30 savol = 60).
 * - Tezlik bonusi: maks. 39 ball (vaqt ichida qanchalik tez tugatilganiga bog‘liq),
 *   faqat kamida bitta to‘g‘ri javob bo‘lsa (0 to‘g‘ri → 0 ball, tezlik bonusi yo‘q).
 *
 * Leaderboardda yig‘indi teng bo‘lsa, kamroq vaqt sarf etgan o‘quvchi yuqoriroq
 * (`lib/student-ranking.ts` — SUM(secondsUsed) bo‘yicha qo‘shimcha saralash).
 */
const MAX_BASE_POINTS = 60;
const MAX_SPEED_BONUS = 39;

export function computeRankPoints(
  score: number,
  total: number,
  secondsUsed: number | null,
  durationMinutes: number,
): number {
  if (total <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, score / total));
  /** Tezlik bonusi bo‘sh yoki noto‘g‘ri topshiruvda ishlatilmasin (masalan 0/30 + 35 s → 39 ball xatosi). */
  if (ratio <= 0) return 0;

  const base = Math.round(ratio * MAX_BASE_POINTS);

  const allocated = Math.max(120, durationMinutes * 60);
  const usedRaw = secondsUsed ?? allocated;
  const used = Math.min(usedRaw, allocated + 180);
  const saved = Math.max(0, allocated - used);
  const speedBonus = Math.round((saved / allocated) * MAX_SPEED_BONUS);

  return Math.max(0, Math.min(MAX_BASE_POINTS + MAX_SPEED_BONUS, base + speedBonus));
}
