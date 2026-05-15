import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** `prisma generate` yoki model maydonlari o‘zgaganda fingerprint almashadi — eski client tashlanadi. */
  prismaSchemaFingerprint?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** `Question.imageUrl` kabi yangi ustun qo‘shilganda ham instansiya yangilanishi uchun. */
function prismaSchemaFingerprint(): string {
  const keys = (...enums: object[]) => enums.flatMap((e) => Object.keys(e)).sort().join("\0");
  return keys(
    Prisma.QuestionScalarFieldEnum,
    Prisma.TestScalarFieldEnum,
    Prisma.TestProgressScalarFieldEnum,
    Prisma.TestAttemptScalarFieldEnum,
    Prisma.UserScalarFieldEnum,
  );
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
  const fp = prismaSchemaFingerprint();
  const g = globalForPrisma.prisma;
  if (g && globalForPrisma.prismaSchemaFingerprint === fp && isPrismaClientFresh(g)) return g;

  if (g) void g.$disconnect().catch(() => {});
  const next = createPrismaClient();
  globalForPrisma.prisma = next;
  globalForPrisma.prismaSchemaFingerprint = fp;
  return next;
}

export const prisma = resolvePrisma();
