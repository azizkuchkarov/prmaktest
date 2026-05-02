import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Eski dev-processda saqlangan PrismaClient ba’zan yangi delegate’larsiz qoladi (generate + restartsiz). */
function hasTestAttemptDelegate(c: PrismaClient): boolean {
  return typeof (c as unknown as { testAttempt?: { create?: unknown } }).testAttempt?.create === "function";
}

function resolvePrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return globalForPrisma.prisma ?? createPrismaClient();
  }

  const g = globalForPrisma.prisma;
  if (g && hasTestAttemptDelegate(g)) return g;

  if (g) void g.$disconnect().catch(() => {});
  const next = createPrismaClient();
  globalForPrisma.prisma = next;
  return next;
}

export const prisma = resolvePrisma();
