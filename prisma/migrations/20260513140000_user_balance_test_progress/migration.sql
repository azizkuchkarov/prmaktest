-- AlterTable
ALTER TABLE "User" ADD COLUMN "balanceSum" INTEGER NOT NULL DEFAULT 100000;

-- CreateTable
CREATE TABLE "TestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "chargedSum" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TestProgress_userId_testId_key" ON "TestProgress"("userId", "testId");
CREATE INDEX "TestProgress_userId_idx" ON "TestProgress"("userId");
CREATE INDEX "TestProgress_testId_idx" ON "TestProgress"("testId");

ALTER TABLE "TestProgress" ADD CONSTRAINT "TestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestProgress" ADD CONSTRAINT "TestProgress_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
