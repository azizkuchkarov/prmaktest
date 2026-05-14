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

function hasTestProgressDelegate(c: PrismaClient): boolean {
  return typeof (c as unknown as { testProgress?: { findUnique?: unknown } }).testProgress?.findUnique ===
    "function";
}

function isPrismaClientFresh(c: PrismaClient): boolean {
  return hasTestAttemptDelegate(c) && hasTestProgressDelegate(c);
}

function resolvePrisma(): PrismaClient {
  const g = globalForPrisma.prisma;
  if (g && isPrismaClientFresh(g)) return g;

  if (g) void g.$disconnect().catch(() => {});
  const next = createPrismaClient();
  globalForPrisma.prisma = next;
  return next;
}

export const prisma = resolvePrisma();
