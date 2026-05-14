-- Bir foydalanuvchi — bir test uchun faqat bitta urinish (reyting / tarix)
DELETE FROM "TestAttempt" a
WHERE EXISTS (
  SELECT 1 FROM "TestAttempt" b
  WHERE b."userId" = a."userId"
    AND b."testId" = a."testId"
    AND (
      b."createdAt" > a."createdAt"
      OR (b."createdAt" = a."createdAt" AND b.id > a.id)
    )
);

CREATE UNIQUE INDEX "TestAttempt_userId_testId_key" ON "TestAttempt"("userId", "testId");
