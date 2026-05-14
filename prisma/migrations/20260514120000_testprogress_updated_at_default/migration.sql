-- Ba'zi muhitlarda INSERT vaqtida `updatedAt` bo'lmasa xato; Prisma odatda yuboradi, DEFAULT qo'shimcha xavfsizlik
ALTER TABLE "TestProgress" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
