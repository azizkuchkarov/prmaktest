-- Balans default 0, mavjud foydalanuvchilar balansi 0
ALTER TABLE "User" ALTER COLUMN "balanceSum" SET DEFAULT 0;
UPDATE "User" SET "balanceSum" = 0;

-- Click to'lov depozitlari
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

CREATE TABLE "BalanceDeposit" (
    "id" TEXT NOT NULL,
    "prepareSeq" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "amountSum" INTEGER NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "clickTransId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BalanceDeposit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BalanceDeposit_prepareSeq_key" ON "BalanceDeposit"("prepareSeq");
CREATE INDEX "BalanceDeposit_userId_idx" ON "BalanceDeposit"("userId");

ALTER TABLE "BalanceDeposit" ADD CONSTRAINT "BalanceDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
