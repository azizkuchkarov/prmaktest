-- Eski 20260518122946_news_read versiyasi BalanceDeposit / TestProgress uchun updatedAt DEFAULT ini olib tashlagan edi.
-- schema.prisma dagi @updatedAt bilan moslash.
ALTER TABLE "BalanceDeposit" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TestProgress" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- schema.prisma: AdminSiteSettings.id @default("default")
ALTER TABLE "AdminSiteSettings" ALTER COLUMN "id" SET DEFAULT 'default';
