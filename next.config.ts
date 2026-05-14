import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Turbopack Prisma clientni noto‘g‘ri bundle qilganda ba’zi delegate’lar (masalan testAttempt) yo‘qolishi mumkin.
  serverExternalPackages: ["@prisma/client", "prisma"],
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  /** Barrel importlardan faqat ishlatilgan modullarni yuklash (bundle kichrayadi) */
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
  /** Telefon IP dan dev ochishda webpack HMR uchun (faqat dev) */
  ...(isProd
    ? {}
    : {
        allowedDevOrigins: ["192.168.97.238"],
      }),
};

export default nextConfig;
