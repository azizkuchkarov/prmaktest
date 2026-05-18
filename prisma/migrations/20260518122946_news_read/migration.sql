-- CreateTable
CREATE TABLE "NewsRead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsRead_userId_idx" ON "NewsRead"("userId");

-- CreateIndex
CREATE INDEX "NewsRead_newsId_idx" ON "NewsRead"("newsId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsRead_userId_newsId_key" ON "NewsRead"("userId", "newsId");

-- AddForeignKey
ALTER TABLE "NewsRead" ADD CONSTRAINT "NewsRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsRead" ADD CONSTRAINT "NewsRead_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
