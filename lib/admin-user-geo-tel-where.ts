import type { Prisma } from "@prisma/client";
import { normalizeUzbekPhone } from "@/lib/phone";
import { isViloyat } from "@/lib/viloyats";

/** Viloyat yoki telefon bo‘yicha qidiruv — ikkisi ham yo‘q bo‘lsa undefined */
export function buildGeoTelUserWhere(
  validViloyat: string | undefined,
  telSearchRaw: string | undefined,
): Prisma.UserWhereInput | undefined {
  const parts: Prisma.UserWhereInput[] = [];
  if (validViloyat) parts.push({ viloyat: validViloyat });

  const raw = telSearchRaw?.trim();
  if (raw) {
    const normalized = normalizeUzbekPhone(raw);
    if (normalized) {
      parts.push({ phone: normalized });
    } else {
      const digits = raw.replace(/\D/g, "");
      if (digits.length >= 4) {
        const prefix =
          digits.startsWith("998") ? digits : digits.length === 9 && /^9\d{8}$/.test(digits) ? `998${digits}` : digits;
        parts.push({ phone: { startsWith: prefix } });
      }
    }
  }

  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0]! : { AND: parts };
}

export function buildStudentUsersWhere(
  validViloyat: string | undefined,
  telSearchRaw: string | undefined,
): Prisma.UserWhereInput | undefined {
  const g = buildGeoTelUserWhere(validViloyat, telSearchRaw);
  if (!g) return undefined;
  return { AND: [g, { appUserRole: "STUDENT" }] };
}

export function buildTeacherUsersWhere(
  validViloyat: string | undefined,
  telSearchRaw: string | undefined,
): Prisma.UserWhereInput | undefined {
  const g = buildGeoTelUserWhere(validViloyat, telSearchRaw);
  if (!g) return undefined;
  return {
    AND: [g, { appUserRole: { in: ["TEACHER", "TEACHER_PENDING"] } }],
  };
}
