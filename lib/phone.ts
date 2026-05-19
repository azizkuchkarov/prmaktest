/** Raqamlarni `998` + 9 raqam (jami 12) ko'rinishiga keltirish */
export function normalizeUzbekPhone(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("998")) return d;
  if (d.length === 9 && /^9\d{8}$/.test(d)) return `998${d}`;
  // 8 94… mahalliy yozilish (10 ta raqam)
  if (d.length === 10 && d.startsWith("89") && /^89\d{8}$/.test(d)) {
    return normalizeUzbekPhone(d.slice(1));
  }
  if (d.length === 11 && d.startsWith("89")) return `998${d.slice(1)}`;
  return null;
}

/**
 * Telegram kontakt / tashqi API dan kelgan raqamni bazadagi `User.phone` bilan topish uchun
 * barcha mantiqiy 998…12 variantlar (takrorlarsiz).
 */
export function phoneKeysForLookup(raw: string): string[] {
  const keys = new Set<string>();
  const add = (v: string | null) => {
    if (v && v.length === 12 && v.startsWith("998")) keys.add(v);
  };

  add(normalizeUzbekPhone(raw));
  const d = raw.replace(/\D/g, "");
  add(normalizeUzbekPhone(d));

  if (d.startsWith("00")) {
    add(normalizeUzbekPhone(d.slice(2)));
  }

  let z = d;
  while (z.startsWith("0") && z.length >= 12) {
    z = z.slice(1);
    add(normalizeUzbekPhone(z));
  }

  // Takroriy davlat kodi: 998998...
  if (d.startsWith("998998") && d.length >= 15) {
    add(normalizeUzbekPhone(d.slice(3)));
  }

  return [...keys];
}

export function formatPhoneDisplay(phone998: string): string {
  if (phone998.length !== 12 || !phone998.startsWith("998")) return phone998;
  const r = phone998.slice(3);
  return `+998 ${r.slice(0, 2)} ${r.slice(2, 5)} ${r.slice(5, 7)} ${r.slice(7)}`;
}
