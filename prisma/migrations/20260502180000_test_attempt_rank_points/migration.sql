-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN "rankPoints" INTEGER NOT NULL DEFAULT 0;

-- Eski urinishlar: faqat to‘g‘rilik asosida taxminiy ball (tezlik ma’lum bo‘lmagan)
UPDATE "TestAttempt"
SET "rankPoints" = GREATEST(
  0,
  ROUND((100.0 * "score") / NULLIF("total", 0))::integer
)
WHERE "total" > 0;
