/** O'zbekiston Respublikasi viloyatlari va Toshkent shahri, Qoraqalpog'iston */
export const VILOYATLAR = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Farg'ona viloyati",
  "Jizzax viloyati",
  "Qashqadaryo viloyati",
  "Navoiy viloyati",
  "Namangan viloyati",
  "Samarqand viloyati",
  "SirDaryo viloyati",
  "Surxondaryo viloyati",
  "Xorazm viloyati",
  "Qoraqalpog'iston Respublikasi",
] as const;

export type Viloyat = (typeof VILOYATLAR)[number];

export function isViloyat(value: string): value is Viloyat {
  return (VILOYATLAR as readonly string[]).includes(value);
}
