/** Raqamlarni `998` + 9 raqam (jami 12) ko'rinishiga keltirish */
export function normalizeUzbekPhone(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("998")) return d;
  if (d.length === 9 && /^9\d{8}$/.test(d)) return `998${d}`;
  if (d.length === 11 && d.startsWith("89")) return `998${d.slice(1)}`;
  return null;
}

export function formatPhoneDisplay(phone998: string): string {
  if (phone998.length !== 12 || !phone998.startsWith("998")) return phone998;
  const r = phone998.slice(3);
  return `+998 ${r.slice(0, 2)} ${r.slice(2, 5)} ${r.slice(5, 7)} ${r.slice(7)}`;
}
