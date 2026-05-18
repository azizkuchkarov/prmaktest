import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

export async function markNewsAsRead(userId: string, newsId: string) {
  await prisma.newsRead.upsert({
    where: { userId_newsId: { userId, newsId } },
    create: { userId, newsId },
    update: {},
  });
  // revalidatePath render ichida chaqirilmasligi kerak (Next 16).
  after(() => {
    revalidatePath("/kabinet");
    revalidatePath("/yangiliklar");
    revalidatePath(`/yangiliklar/${newsId}`);
  });
}

export async function getNewsReadIdSet(userId: string, newsIds: string[]): Promise<Set<string>> {
  if (newsIds.length === 0) return new Set();
  const rows = await prisma.newsRead.findMany({
    where: { userId, newsId: { in: newsIds } },
    select: { newsId: true },
  });
  return new Set(rows.map((r) => r.newsId));
}
