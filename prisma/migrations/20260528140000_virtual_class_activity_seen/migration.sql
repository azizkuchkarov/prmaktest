-- AlterTable
ALTER TABLE "VirtualClass" ADD COLUMN "teacherActivitySeenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VirtualClassMember" ADD COLUMN "studentActivitySeenAt" TIMESTAMP(3);
