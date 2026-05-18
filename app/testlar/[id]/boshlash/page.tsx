import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestRunnerGate } from "@/components/test/TestRunnerGate";
import { getCurrentStudent } from "@/lib/student-auth";
import { isStudentProfileComplete, PROFILE_SETUP_PATH } from "@/lib/student-profile";
import { prepareTestSession } from "./actions";
import { formatPriceSum, formatUzInteger } from "@/lib/format-uzs";

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
          imageUrl: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          optionAImageUrl: true,
          optionBImageUrl: true,
          optionCImageUrl: true,
          optionDImageUrl: true,
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

  const prep = await prepareTestSession(test.id);
  if (!prep.ok) {
    if (prep.code === "auth") redirect("/auth/kirish");

    if (prep.code === "insufficient") {
      return (
        <div className="min-h-[100dvh] bg-gradient-to-b from-amber-50/90 to-white px-4 py-12 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-lg">
            <h1 className="text-lg font-bold text-slate-900">Balans yetarli emas</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Bu test narxi:{" "}
              <strong>
                {prep.priceSum != null && prep.priceSum > 0
                  ? formatPriceSum(prep.priceSum)
                  : "bepul"}
              </strong>
              . Sizning balansingiz:{" "}
              <strong>
                {prep.balanceSum != null ? `${formatUzInteger(prep.balanceSum)} so'm` : "—"}
              </strong>
              .
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Kabinetda «Balans to‘ldirish (CLICK)» bo‘limidan hisobingizni to‘ldirishingiz mumkin.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/kabinet"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 py-3 text-sm font-bold text-white shadow-md"
              >
                Kabinetga qaytish
              </Link>
              <Link
                href={`/testlar/${id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              >
                Orqaga
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-slate-700">{prep.message}</p>
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
      balanceSum={prep.balanceSum}
      priceSum={prep.priceSum}
      isRetake={prep.isRetake}
      initialSession={prep.initialSession}
    />
  );
}
