-- CreateTable
CREATE TABLE "AdminSiteSettings" (
    "id" TEXT NOT NULL,
    "supportTelegramChatId" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportHelpRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportHelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportHelpRequest_userId_createdAt_idx" ON "SupportHelpRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SupportHelpRequest" ADD CONSTRAINT "SupportHelpRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
