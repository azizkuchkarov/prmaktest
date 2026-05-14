-- AlterTable
ALTER TABLE "User" ADD COLUMN "gradeLevel" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "User_gradeLevel_idx" ON "User"("gradeLevel");
