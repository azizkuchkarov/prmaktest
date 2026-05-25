"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeUzbekPhone } from "@/lib/phone";
import { getStudentSessionUserId } from "@/lib/student-auth";
import {
  parseVirtualClassPrepBlock,
  prepGradeLevelFromBlock,
  virtualClassTestVisibleForPrepGrade,
} from "@/lib/virtual-class-prep-grade";

async function requireApprovedTeacher(): Promise<string> {
  const id = await getStudentSessionUserId();
  if (!id) redirect("/auth/kirish");
  const u = await prisma.user.findUnique({
    where: { id },
    select: { appUserRole: true },
  });
  if (u?.appUserRole !== "TEACHER") redirect("/auth/kirish");
  return id;
}

async function getOwnedClassOrRedirect(teacherId: string, classId: string) {
  const row = await prisma.virtualClass.findFirst({
    where: { id: classId, teacherUserId: teacherId },
    select: { id: true, prepGradeLevel: true },
  });
  if (!row) redirect("/oqituvchi");
  return row;
}

function classPathQs(virtualClassId: string, qp: Record<string, string>): string {
  const qs = new URLSearchParams(qp).toString();
  return qs ? `/oqituvchi/sinflar/${virtualClassId}?${qs}` : `/oqituvchi/sinflar/${virtualClassId}`;
}

/** Yangi virtual sinf: markaz (DB: tuman) + tayyorlov kurs nomi */
export async function createVirtualClassForm(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();

  const prepBlock = parseVirtualClassPrepBlock(formData.get("prepBlock"));
  const tuman = String(formData.get("tuman") ?? "").trim().slice(0, 120);
  const courseName = String(formData.get("courseName") ?? "").trim().slice(0, 160);
  if (!prepBlock) redirect("/oqituvchi?clsErr=prep_invalid");
  if (tuman.length < 2) redirect("/oqituvchi?clsErr=tuman_short");
  if (courseName.length < 2) redirect("/oqituvchi?clsErr=course_short");

  const prepGradeLevel = prepGradeLevelFromBlock(prepBlock);

  const created = await prisma.virtualClass.create({
    data: {
      teacherUserId: teacherId,
      tuman,
      courseName,
      prepGradeLevel,
    },
    select: { id: true },
  });

  revalidatePath("/oqituvchi");
  revalidatePath(`/oqituvchi/sinflar/${created.id}`);
  redirect(`/oqituvchi/sinflar/${created.id}?hint=created`);
}

/** Mobil raqam bo‘yicha taklif — yuborgan zahoti o‘quvchi kabinetiga «tasdiqlang» chiqadi */
export async function inviteStudentByPhone(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  await getOwnedClassOrRedirect(teacherId, virtualClassId);

  const phoneRaw = String(formData.get("studentPhone") ?? "");
  const phone = normalizeUzbekPhone(phoneRaw);
  if (!phone) {
    redirect(classPathQs(virtualClassId, { invErr: "phone" }));
  }

  const teacherPhone = (
    await prisma.user.findUnique({ where: { id: teacherId }, select: { phone: true } })
  )?.phone;
  if (phone === teacherPhone) {
    redirect(classPathQs(virtualClassId, { invErr: "self" }));
  }

  const pupil = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, appUserRole: true },
  });
  if (!pupil || pupil.appUserRole !== "STUDENT") {
    redirect(classPathQs(virtualClassId, { invErr: "not_student" }));
  }

  const existing = await prisma.virtualClassMember.findUnique({
    where: {
      virtualClassId_studentUserId: { virtualClassId, studentUserId: pupil.id },
    },
  });

  const baseHref = `/oqituvchi/sinflar/${virtualClassId}`;

  if (existing?.status === "ACTIVE") {
    redirect(`${baseHref}?invErr=active`);
  }
  if (existing?.status === "AWAITING_STUDENT") {
    redirect(`${baseHref}?hint=invite_pending`);
  }
  if (existing?.status === "AWAITING_TEACHER") {
    redirect(`${baseHref}?invErr=request_exists`);
  }

  /** Yangi taklif yoki takroriy taklif: to‘g‘ridan-to‘g‘ri o‘quvchini tasdiqlash bosqichiga */
  await prisma.virtualClassMember.upsert({
    where: {
      virtualClassId_studentUserId: { virtualClassId, studentUserId: pupil.id },
    },
    create: {
      virtualClassId,
      studentUserId: pupil.id,
      status: "AWAITING_STUDENT",
      initiatedBy: "TEACHER",
    },
    update: {
      status: "AWAITING_STUDENT",
      initiatedBy: "TEACHER",
    },
  });

  revalidatePath(`/oqituvchi/sinflar/${virtualClassId}`);
  revalidatePath("/kabinet/virtual-sinflar");
  redirect(`${baseHref}?hint=invite_sent`);
}

/** Eski yozuvlar: TEACHER_INVITE_DRAFT → AWAITING_STUDENT (ochiq ustama) */
export async function teacherConfirmOwnInviteDraft(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  await getOwnedClassOrRedirect(teacherId, virtualClassId);

  const m = await prisma.virtualClassMember.findFirst({
    where: { id: memberId, virtualClassId },
  });
  const baseHref = `/oqituvchi/sinflar/${virtualClassId}`;
  if (!m || m.status !== "TEACHER_INVITE_DRAFT") {
    redirect(`${baseHref}?invErr=no_draft`);
  }

  await prisma.virtualClassMember.update({
    where: { id: m.id },
    data: { status: "AWAITING_STUDENT" },
  });
  revalidatePath(baseHref);
  revalidatePath("/kabinet/virtual-sinflar");
  redirect(`${baseHref}?hint=invite_sent`);
}

/** O‘quvchini sinfka qo‘shish so‘rovi kelganda tasdiqlash */
export async function teacherApproveStudentRequest(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  await getOwnedClassOrRedirect(teacherId, virtualClassId);

  const m = await prisma.virtualClassMember.findFirst({
    where: { id: memberId, virtualClassId },
  });
  const baseHref = `/oqituvchi/sinflar/${virtualClassId}`;
  if (!m || m.status !== "AWAITING_TEACHER") redirect(`${baseHref}?invErr=bad_state`);

  await prisma.virtualClassMember.update({
    where: { id: m.id },
    data: { status: "ACTIVE" },
  });

  revalidatePath(baseHref);
  revalidatePath("/kabinet/virtual-sinflar");
  redirect(`${baseHref}?hint=request_ok`);
}

export async function teacherDeclineMembership(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  await getOwnedClassOrRedirect(teacherId, virtualClassId);

  const m = await prisma.virtualClassMember.findFirst({
    where: { id: memberId, virtualClassId },
  });
  const baseHref = `/oqituvchi/sinflar/${virtualClassId}`;
  if (!m) redirect(`${baseHref}?invErr=bad_state`);

  await prisma.virtualClassMember.update({
    where: { id: m.id },
    data: { status: "DECLINED" },
  });

  revalidatePath(baseHref);
  revalidatePath("/kabinet/virtual-sinflar");
  redirect(`${baseHref}?hint=declined`);
}

export async function assignCatalogTest(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  const testId = String(formData.get("testId") ?? "").trim();
  const vc = await getOwnedClassOrRedirect(teacherId, virtualClassId);

  const test = await prisma.test.findFirst({
    where: { id: testId, isPublished: true },
    select: {
      id: true,
      examSchoolProgram: true,
      examTargetCohort: true,
      specializedSixTrack: true,
    },
  });
  if (!test || !virtualClassTestVisibleForPrepGrade(test, vc.prepGradeLevel)) {
    redirect(`/oqituvchi/sinflar/${virtualClassId}?testErr=not_found`);
  }

  await prisma.virtualClassAssignedTest.create({
    data: { virtualClassId, testId },
  }).catch(() => undefined);

  revalidatePath(`/oqituvchi/sinflar/${virtualClassId}`);
  revalidatePath("/kabinet/virtual-sinflar");
  redirect(`/oqituvchi/sinflar/${virtualClassId}?hint=test_assigned`);
}

export async function unassignCatalogTest(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  await getOwnedClassOrRedirect(teacherId, virtualClassId);

  await prisma.virtualClassAssignedTest.deleteMany({
    where: { id: assignmentId, virtualClassId },
  });

  revalidatePath(`/oqituvchi/sinflar/${virtualClassId}`);
  revalidatePath("/kabinet/virtual-sinflar");
  redirect(`/oqituvchi/sinflar/${virtualClassId}?hint=test_removed`);
}

export async function markTeacherClassActivitySeenAction(formData: FormData): Promise<void> {
  const teacherId = await requireApprovedTeacher();
  const virtualClassId = String(formData.get("virtualClassId") ?? "").trim();
  await getOwnedClassOrRedirect(teacherId, virtualClassId);
  const { markTeacherClassActivitySeen } = await import("@/lib/virtual-class-new");
  await markTeacherClassActivitySeen(teacherId, virtualClassId);
  revalidatePath(`/oqituvchi/sinflar/${virtualClassId}`);
  revalidatePath("/oqituvchi/sinfxonalar");
  revalidatePath("/oqituvchi");
  redirect(`/oqituvchi/sinflar/${virtualClassId}?hint=activity_seen`);
}
