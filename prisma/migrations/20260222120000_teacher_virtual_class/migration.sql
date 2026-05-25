-- Rol va virtual sinf modellari (barcha User -> STUDENT default)

CREATE TYPE "AppUserRole" AS ENUM ('STUDENT', 'TEACHER_PENDING', 'TEACHER');

ALTER TABLE "User" ADD COLUMN "appUserRole" "AppUserRole" NOT NULL DEFAULT 'STUDENT';

CREATE INDEX "User_appUserRole_idx" ON "User" ("appUserRole");

CREATE TYPE "VirtualMembershipStatus" AS ENUM (
  'TEACHER_INVITE_DRAFT',
  'AWAITING_STUDENT',
  'AWAITING_TEACHER',
  'ACTIVE',
  'DECLINED'
);

CREATE TYPE "VirtualMembershipInitiator" AS ENUM ('TEACHER', 'STUDENT');

CREATE TABLE "VirtualClass" (
    "id" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "tuman" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VirtualClassMember" (
    "id" TEXT NOT NULL,
    "virtualClassId" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "status" "VirtualMembershipStatus" NOT NULL,
    "initiatedBy" "VirtualMembershipInitiator" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualClassMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VirtualClassAssignedTest" (
    "id" TEXT NOT NULL,
    "virtualClassId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualClassAssignedTest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VirtualClassMember_virtualClassId_studentUserId_key" ON "VirtualClassMember"("virtualClassId", "studentUserId");

CREATE INDEX "VirtualClassMember_studentUserId_status_idx" ON "VirtualClassMember"("studentUserId", "status");

CREATE INDEX "VirtualClassMember_virtualClassId_idx" ON "VirtualClassMember"("virtualClassId");

CREATE INDEX "VirtualClass_teacherUserId_idx" ON "VirtualClass"("teacherUserId");

CREATE UNIQUE INDEX "VirtualClassAssignedTest_virtualClassId_testId_key" ON "VirtualClassAssignedTest"("virtualClassId", "testId");

CREATE INDEX "VirtualClassAssignedTest_virtualClassId_idx" ON "VirtualClassAssignedTest"("virtualClassId");

CREATE INDEX "VirtualClassAssignedTest_testId_idx" ON "VirtualClassAssignedTest"("testId");

ALTER TABLE "VirtualClass" ADD CONSTRAINT "VirtualClass_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirtualClassMember" ADD CONSTRAINT "VirtualClassMember_virtualClassId_fkey" FOREIGN KEY ("virtualClassId") REFERENCES "VirtualClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirtualClassMember" ADD CONSTRAINT "VirtualClassMember_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirtualClassAssignedTest" ADD CONSTRAINT "VirtualClassAssignedTest_virtualClassId_fkey" FOREIGN KEY ("virtualClassId") REFERENCES "VirtualClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirtualClassAssignedTest" ADD CONSTRAINT "VirtualClassAssignedTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
