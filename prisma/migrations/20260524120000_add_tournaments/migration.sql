-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "examTargetCohort" "ExamTargetCohort" NOT NULL,
    "testId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentProgress" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAttempt" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "secondsUsed" INTEGER,
    "rankPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tournament_examTargetCohort_startsAt_idx" ON "Tournament"("examTargetCohort", "startsAt");

-- CreateIndex
CREATE INDEX "Tournament_testId_idx" ON "Tournament"("testId");

-- CreateIndex
CREATE INDEX "TournamentProgress_userId_idx" ON "TournamentProgress"("userId");

-- CreateIndex
CREATE INDEX "TournamentProgress_tournamentId_idx" ON "TournamentProgress"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentProgress_userId_tournamentId_key" ON "TournamentProgress"("userId", "tournamentId");

-- CreateIndex
CREATE INDEX "TournamentAttempt_tournamentId_rankPoints_idx" ON "TournamentAttempt"("tournamentId", "rankPoints");

-- CreateIndex
CREATE INDEX "TournamentAttempt_userId_idx" ON "TournamentAttempt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAttempt_userId_tournamentId_key" ON "TournamentAttempt"("userId", "tournamentId");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentProgress" ADD CONSTRAINT "TournamentProgress_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentProgress" ADD CONSTRAINT "TournamentProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAttempt" ADD CONSTRAINT "TournamentAttempt_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAttempt" ADD CONSTRAINT "TournamentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
