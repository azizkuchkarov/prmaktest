-- Maktab programmasi va sinf bloklari (4-sinf / 6-sinf sikli)

CREATE TYPE "ExamSchoolProgram" AS ENUM ('PRESIDENT_SCHOOL', 'SPECIALIZED_SCHOOL', 'AL_XORAZMIY');

CREATE TYPE "ExamTargetCohort" AS ENUM ('COHORT_4_PREP', 'COHORT_6_CYCLE');

CREATE TYPE "SpecializedSixTrack" AS ENUM ('NONE', 'EXACT_SCIENCES', 'NATURAL_SCIENCES');

ALTER TABLE "Test" ADD COLUMN "examSchoolProgram" "ExamSchoolProgram" NOT NULL DEFAULT 'PRESIDENT_SCHOOL';

ALTER TABLE "Test" ADD COLUMN "examTargetCohort" "ExamTargetCohort" NOT NULL DEFAULT 'COHORT_4_PREP';

ALTER TABLE "Test" ADD COLUMN "specializedSixTrack" "SpecializedSixTrack" NOT NULL DEFAULT 'NONE';

CREATE INDEX "Test_exam_program_cohort_idx" ON "Test" ("examSchoolProgram", "examTargetCohort");
