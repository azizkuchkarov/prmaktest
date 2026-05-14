/**
 * Butun son — Node va brauzerda bir xil chiqadi (`toLocaleString` farqi bo'lmaydi).
 * Mingliklar: &nbsp;bo'sh joy (masalan 95 000).
 */
export function formatUzInteger(n: number): string {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return "0";
  const neg = x < 0;
  const abs = Math.abs(x);
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return neg ? `-${grouped}` : grouped;
}

/** So'm ko'rinishida (UI), 0 bo'lsa bo'sh / bepul */
export function formatPriceSum(priceSum: number): string {
  const n = Math.round(Number(priceSum));
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${formatUzInteger(n)} so'm`;
}
