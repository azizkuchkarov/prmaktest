-- CreateEnum
CREATE TYPE "TestCatalogCategory" AS ENUM ('MOCK', 'MATHEMATICS', 'CRITICAL_LOGIC', 'ENGLISH');

-- AlterTable
ALTER TABLE "Test" ADD COLUMN "catalogCategory" "TestCatalogCategory" NOT NULL DEFAULT 'MATHEMATICS';
