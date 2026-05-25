import { prisma } from "@/lib/prisma";

/** Hodisa `seenAt` dan keyin bo‘lsa — hali «yangi» */
export function isVirtualActivityNew(eventAt: Date, seenAt: Date | null): boolean {
  if (!seenAt) return true;
  return eventAt.getTime() > seenAt.getTime();
}

type StudentMemberRow = {
  status: string;
  updatedAt: Date;
  studentActivitySeenAt: Date | null;
  virtualClass: {
    assignedTests: { createdAt: Date }[];
  };
};

export function countStudentMemberNews(m: StudentMemberRow): number {
  let n = 0;
  const seen = m.studentActivitySeenAt;
  if (m.status === "AWAITING_STUDENT" && isVirtualActivityNew(m.updatedAt, seen)) {
    n += 1;
  }
  if (m.status === "ACTIVE") {
    for (const a of m.virtualClass.assignedTests) {
      if (isVirtualActivityNew(a.createdAt, seen)) n += 1;
    }
  }
  return n;
}

export function studentMemberHasNews(m: StudentMemberRow): boolean {
  return countStudentMemberNews(m) > 0;
}

export async function getStudentVirtualSinflarNewCount(studentUserId: string): Promise<number> {
  const members = await prisma.virtualClassMember.findMany({
    where: {
      studentUserId,
      status: { in: ["ACTIVE", "AWAITING_STUDENT"] },
    },
    select: {
      status: true,
      updatedAt: true,
      studentActivitySeenAt: true,
      virtualClass: {
        select: {
          assignedTests: { select: { createdAt: true } },
        },
      },
    },
  });
  return members.reduce((sum, m) => sum + countStudentMemberNews(m), 0);
}

type TeacherClassRow = {
  id: string;
  teacherActivitySeenAt: Date | null;
  members: { status: string; updatedAt: Date }[];
};

export function countTeacherClassPendingNews(c: TeacherClassRow): number {
  const seen = c.teacherActivitySeenAt;
  return c.members.filter(
    (m) => m.status === "AWAITING_TEACHER" && isVirtualActivityNew(m.updatedAt, seen),
  ).length;
}

export async function getTeacherVirtualSinflarNewCount(teacherUserId: string): Promise<number> {
  const classes = await prisma.virtualClass.findMany({
    where: { teacherUserId },
    select: {
      id: true,
      teacherActivitySeenAt: true,
      members: {
        where: { status: "AWAITING_TEACHER" },
        select: { status: true, updatedAt: true },
      },
    },
  });
  return classes.reduce((sum, c) => sum + countTeacherClassPendingNews(c), 0);
}

export async function markStudentVirtualSinflarSeen(studentUserId: string): Promise<void> {
  const now = new Date();
  await prisma.virtualClassMember.updateMany({
    where: {
      studentUserId,
      status: { in: ["ACTIVE", "AWAITING_STUDENT", "AWAITING_TEACHER"] },
    },
    data: { studentActivitySeenAt: now },
  });
}

export async function markTeacherClassActivitySeen(
  teacherUserId: string,
  virtualClassId: string,
): Promise<void> {
  await prisma.virtualClass.updateMany({
    where: { id: virtualClassId, teacherUserId },
    data: { teacherActivitySeenAt: new Date() },
  });
}
