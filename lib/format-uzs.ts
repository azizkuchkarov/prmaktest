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

/** Sana-vaqt — SSR va brauzerda bir xil (locale `toLocaleString` hydration xatosini oldini oladi) */
export function formatUzDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const months = [
    "yan",
    "fev",
    "mar",
    "apr",
    "may",
    "iyn",
    "iyl",
    "avg",
    "sen",
    "okt",
    "noy",
    "dek",
  ] as const;
  return `${pad(d.getDate())}-${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** So'm ko'rinishida (UI), 0 bo'lsa bo'sh / bepul */
export function formatPriceSum(priceSum: number): string {
  const n = Math.round(Number(priceSum));
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${formatUzInteger(n)} so'm`;
}
