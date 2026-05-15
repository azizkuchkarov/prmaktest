import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** Masalan: NEXT_DEV_EXTRA_ORIGINS=192.168.1.5,10.0.0.2 */
const devExtraOrigins = (process.env.NEXT_DEV_EXTRA_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  /** Brauzer `/uploads/...` ni saqlaydi; ichki qidiruv API route orqali diskdan beradi. */
  async rewrites() {
    return [{ source: "/uploads/questions/:name", destination: "/api/uploads/questions/:name" }];
  },
  /** Docker / minimal VPS: NEXT_STANDALONE=1 npm run build → .next/standalone */
  ...(process.env.NEXT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  // Turbopack Prisma clientni noto‘g‘ri bundle qilganda ba’zi delegate’lar (masalan testAttempt) yo‘qolishi mumkin.
  serverExternalPackages: ["@prisma/client", "prisma"],
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  /** Barrel importlardan faqat ishlatilgan modullarni yuklash (bundle kichrayadi) */
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion", "@base-ui/react"],
  },
  ...(isProd || devExtraOrigins.length === 0
    ? {}
    : { allowedDevOrigins: devExtraOrigins }),
};

export default nextConfig;
