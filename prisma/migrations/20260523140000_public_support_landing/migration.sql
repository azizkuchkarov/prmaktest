-- CreateTable
CREATE TABLE "PublicSupportHelpRequest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicSupportHelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicSupportHelpRequest_phone_createdAt_idx" ON "PublicSupportHelpRequest"("phone", "createdAt");
