-- Bir marta bajariladi (PowerShell):
--   npx prisma db execute --file prisma/repair_news_read_migration_history.sql
--
-- Keyin ketma-ket:
--   npx prisma migrate resolve --applied 20260518122946_news_read
--   npx prisma db execute --file prisma/migrations/20260525120000_fix_news_read_drift_defaults/migration.sql
--   npx prisma migrate resolve --applied 20260525120000_fix_news_read_drift_defaults
--   npx prisma migrate dev
--
-- Maqsad: yangiliklar o'qish migratsiyasi SQL fayli tahrirlangach checksum mos kelmay qolgan qatorni
-- o'chirib, joriy migration.sql bo'yicha qayta yozish (bazaga tegmaydi).

DELETE FROM "_prisma_migrations" WHERE migration_name = '20260518122946_news_read';
