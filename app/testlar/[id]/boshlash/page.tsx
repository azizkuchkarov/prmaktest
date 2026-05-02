import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestRunnerGate } from "@/components/test/TestRunnerGate";
import { getCurrentStudent } from "@/lib/student-auth";
import { isStudentProfileComplete, PROFILE_SETUP_PATH } from "@/lib/student-profile";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const test = await prisma.test.findFirst({
    where: { id, isPublished: true },
    select: { title: true },
  });
  if (!test) return { title: "Test topilmadi" };
  return { title: `${test.title} — yechish` };
}

export default async function TestStartPage({ params }: Props) {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (!isStudentProfileComplete(student)) redirect(PROFILE_SETUP_PATH);

  const { id } = await params;
  const test = await prisma.test.findFirst({
    where: { id, isPublished: true },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          text: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
        },
      },
    },
  });

  if (!test) notFound();

  if (test.questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-slate-700">Bu testda hozircha savollar yo&apos;q.</p>
        <Link href={`/testlar/${id}`} className="mt-4 inline-block text-sm font-semibold text-blue-600">
          Orqaga
        </Link>
      </div>
    );
  }

  return (
    <TestRunnerGate
      testId={test.id}
      title={test.title}
      durationMinutes={test.durationMinutes}
      questions={test.questions}
    />
  );
}
