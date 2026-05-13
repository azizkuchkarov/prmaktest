import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack Prisma clientni noto‘g‘ri bundle qilganda ba’zi delegate’lar (masalan testAttempt) yo‘qolishi mumkin.
  serverExternalPackages: ["@prisma/client", "prisma"],
  /** Telefon IP dan dev ochishda webpack HMR uchun (o‘z LAN IP ingizni qo‘shing) */
  allowedDevOrigins: ["192.168.97.238"],
};

export default nextConfig;
