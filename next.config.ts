import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack Prisma clientni noto‘g‘ri bundle qilganda ba’zi delegate’lar (masalan testAttempt) yo‘qolishi mumkin.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
