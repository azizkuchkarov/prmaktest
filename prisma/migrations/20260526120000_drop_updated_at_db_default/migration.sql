-- Prisma @updatedAt — qiymatni Prisma client yozadi; DB DEFAULT ko'pincha yo'q.
-- Avvalgi tuzatish migratsiyasi bu ustunlarga DEFAULT qo'shgan bo'lsa, bu yerda schema.introspection bilan moslashtiramiz.
ALTER TABLE "BalanceDeposit" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TestProgress" ALTER COLUMN "updatedAt" DROP DEFAULT;
