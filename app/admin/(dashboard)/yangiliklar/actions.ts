"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notifyTelegramNewsPublished } from "@/lib/telegram-broadcast";

export type ActionState = { error?: string } | undefined;

export async function createNews(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const published = formData.get("published") === "on";

  if (!title) return { error: "Sarlavha majburiy." };

  const news = await prisma.news.create({
    data: { title, excerpt, body, published },
    select: { id: true, title: true, published: true },
  });

  revalidatePath("/yangiliklar");
  revalidatePath("/admin/yangiliklar");

  if (news.published) {
    try {
      await notifyTelegramNewsPublished(news.id, news.title);
    } catch {
      /* Telegram xatosi — yangilik baribir saqlangan */
    }
  }

  redirect("/admin/yangiliklar");
}

export async function updateNews(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const published = formData.get("published") === "on";

  if (!title) return { error: "Sarlavha majburiy." };

  const prev = await prisma.news.findUnique({
    where: { id },
    select: { published: true },
  });

  await prisma.news.update({
    where: { id },
    data: { title, excerpt, body, published },
  });

  revalidatePath("/yangiliklar");
  revalidatePath(`/yangiliklar/${id}`);
  revalidatePath("/admin/yangiliklar");

  const becamePublished = published && !prev?.published;
  if (becamePublished) {
    try {
      await notifyTelegramNewsPublished(id, title);
    } catch {
      /* Telegram xatosi */
    }
  }

  redirect("/admin/yangiliklar");
}

export async function deleteNews(id: string) {
  await prisma.news.delete({ where: { id } });
  revalidatePath("/yangiliklar");
  revalidatePath("/admin/yangiliklar");
  redirect("/admin/yangiliklar");
}
