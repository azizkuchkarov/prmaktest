import { prisma } from "@/lib/prisma";

/** Faol virtual sinf a‘zosi bo‘lsa, o‘qituvchi biriktirgan testni sinf blokidan yechish mumkin (sinf gate). */
export async function studentHasVirtualClassAssignmentToTest(
  studentUserId: string,
  testId: string,
): Promise<boolean> {
  const hit = await prisma.virtualClassAssignedTest.findFirst({
    where: {
      testId,
      virtualClass: {
        members: {
          some: {
            studentUserId,
            status: "ACTIVE",
          },
        },
      },
    },
    select: { id: true },
  });
  return Boolean(hit);
}
