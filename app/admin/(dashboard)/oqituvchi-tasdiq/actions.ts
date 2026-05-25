"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function approvePendingTeacher(formData: FormData): Promise<void> {
  const id = String(formData.get("userId") ?? "").trim();
  if (!id) return;

  const row = await prisma.user.findUnique({
    where: { id },
    select: { appUserRole: true },
  });
  if (row?.appUserRole !== "TEACHER_PENDING") return;

  await prisma.user.update({
    where: { id },
    data: { appUserRole: "TEACHER" },
  });

  revalidatePath("/admin/oqituvchi-tasdiq");
  revalidatePath("/admin/oqituvchilar");
  revalidatePath("/admin/userlar");
}
