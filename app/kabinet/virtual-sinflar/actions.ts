"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeUzbekPhone } from "@/lib/phone";
import { getStudentSessionUserId } from "@/lib/student-auth";

async function requireStudentStrict(): Promise<string> {
  const id = await getStudentSessionUserId();
  if (!id) redirect("/auth/kirish");
  const row = await prisma.user.findUnique({
    where: { id },
    select: { appUserRole: true },
  });
  if (row?.appUserRole !== "STUDENT") redirect("/oqituvchi");
  return id;
}

export type LookupClassesResult =
  | { ok: false; message: string }
  | {
      ok: true;
      phone998: string;
      classes: { id: string; label: string; courseName: string; tuman: string }[];
    };

export async function lookupTeacherClassesByPhone(phoneRaw: string): Promise<LookupClassesResult> {
  await requireStudentStrict();

  const phone = normalizeUzbekPhone(phoneRaw);
  if (!phone) return { ok: false, message: "Telefon noto‘g‘ri yozilgan." };

  const teacher = await prisma.user.findFirst({
    where: { phone, appUserRole: "TEACHER" },
    select: {
      id: true,
      taughtVirtualClasses: {
        select: { id: true, tuman: true, courseName: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!teacher) {
    return { ok: false, message: "Bu raqam bo‘yicha tasdiqlangan o‘qituvchi topilmadi." };
  }

  if (teacher.taughtVirtualClasses.length === 0) {
    return {
      ok: false,
      message:
        "Bu o‘qituvchining virtual sinfi yoʻq — o‘qituvchi kabinetidan sinf yaratilishini kuting.",
    };
  }

  return {
    ok: true,
    phone998: phone,
    classes: teacher.taughtVirtualClasses.map((c) => ({
      id: c.id,
      courseName: c.courseName,
      tuman: c.tuman,
      label: `${c.courseName} — ${c.tuman}`,
    })),
  };
}

export async function requestJoinVirtualClassForm(formData: FormData): Promise<void> {
  const studentId = await requireStudentStrict();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  const phoneHidden = String(formData.get("teacherPhone998") ?? "").trim();

  const phone = normalizeUzbekPhone(phoneHidden);
  if (!phone) redirect("/kabinet/virtual-sinflar?joinErr=phone");

  const teacher = await prisma.user.findFirst({
    where: { phone, appUserRole: "TEACHER" },
    select: { id: true },
  });
  if (!teacher) redirect("/kabinet/virtual-sinflar?joinErr=no_teacher");

  const cls = await prisma.virtualClass.findFirst({
    where: { id: virtualClassId, teacherUserId: teacher.id },
    select: { id: true },
  });
  if (!cls) redirect("/kabinet/virtual-sinflar?joinErr=no_class");

  const existing = await prisma.virtualClassMember.findUnique({
    where: {
      virtualClassId_studentUserId: { virtualClassId, studentUserId: studentId },
    },
  });

  const home = "/kabinet/virtual-sinflar";

  if (existing?.status === "ACTIVE") {
    redirect(`${home}?joinHint=already_active`);
  }
  if (existing?.status === "AWAITING_TEACHER") {
    redirect(`${home}?joinHint=request_pending`);
  }
  if (existing?.status === "AWAITING_STUDENT") {
    redirect(`${home}?joinErr=invite_use_confirm`);
  }
  if (existing?.status === "TEACHER_INVITE_DRAFT") {
    redirect(`${home}?joinHint=teacher_drafting`);
  }

  if (!existing) {
    await prisma.virtualClassMember.create({
      data: {
        virtualClassId,
        studentUserId: studentId,
        status: "AWAITING_TEACHER",
        initiatedBy: "STUDENT",
      },
    });
  } else if (existing.status === "DECLINED") {
    await prisma.virtualClassMember.update({
      where: { id: existing.id },
      data: {
        status: "AWAITING_TEACHER",
        initiatedBy: "STUDENT",
      },
    });
  } else {
    redirect(`${home}?joinErr=unknown`);
  }

  revalidatePath(home);
  revalidatePath(`/oqituvchi/sinflar/${virtualClassId}`);
  redirect(`${home}?joinHint=request_sent`);
}

export async function studentAcceptTeacherInvite(formData: FormData): Promise<void> {
  const studentId = await requireStudentStrict();
  const memberId = String(formData.get("memberId") ?? "").trim();

  const m = await prisma.virtualClassMember.findFirst({
    where: { id: memberId, studentUserId: studentId },
    select: { id: true, virtualClassId: true, status: true },
  });
  const home = "/kabinet/virtual-sinflar";
  if (!m || m.status !== "AWAITING_STUDENT") redirect(`${home}?joinErr=bad_accept`);

  await prisma.virtualClassMember.update({
    where: { id: m.id },
    data: { status: "ACTIVE" },
  });
  revalidatePath(home);
  revalidatePath(`/oqituvchi/sinflar/${m.virtualClassId}`);
  redirect(`${home}?joinHint=joined`);
}

export async function studentDeclineMembership(formData: FormData): Promise<void> {
  const studentId = await requireStudentStrict();
  const memberId = String(formData.get("memberId") ?? "").trim();

  const m = await prisma.virtualClassMember.findFirst({
    where: { id: memberId, studentUserId: studentId },
    select: { id: true, virtualClassId: true, status: true },
  });
  const home = "/kabinet/virtual-sinflar";
  if (
    !m
    || (m.status !== "AWAITING_STUDENT"
      && m.status !== "AWAITING_TEACHER"
      && m.status !== "TEACHER_INVITE_DRAFT")
  ) {
    redirect(`${home}?joinErr=bad_decline`);
  }

  await prisma.virtualClassMember.update({
    where: { id: m.id },
    data: { status: "DECLINED" },
  });
  revalidatePath(home);
  revalidatePath(`/oqituvchi/sinflar/${m.virtualClassId}`);
  redirect(`${home}?joinHint=you_declined`);
}

/** Virtual sinflar sahifasidagi barcha «yangi» belgilarni ko‘rilgan deb belgilash */
export async function markStudentVirtualSinflarSeenAction(): Promise<void> {
  const studentId = await requireStudentStrict();
  const { markStudentVirtualSinflarSeen } = await import("@/lib/virtual-class-new");
  await markStudentVirtualSinflarSeen(studentId);
  revalidatePath("/kabinet/virtual-sinflar");
  revalidatePath("/kabinet");
  redirect("/kabinet/virtual-sinflar?joinHint=marked_seen");
}
