import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TournamentRunnerGate } from "@/components/tournament/TournamentRunnerGate";
import { getCurrentStudent } from "@/lib/student-auth";
import { isStudentProfileComplete, PROFILE_SETUP_PATH } from "@/lib/student-profile";
import { prepareTournamentSession } from "./actions";
import { formatTournamentWindowUz } from "@/lib/tournament";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TournamentStartPage({ params }: Props) {
  const student = await getCurrentStudent();
  if (!student) redirect("/auth/kirish");
  if (!isStudentProfileComplete(student)) redirect(PROFILE_SETUP_PATH);

  const { id } = await params;
  const tournament = await prisma.tournament.findFirst({
    where: { id, isPublished: true },
    include: {
      test: {
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
      },
    },
  });

  if (!tournament) notFound();

  if (tournament.test.questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-slate-700">Turnir testida savollar yo&apos;q.</p>
        <Link href={`/turnirlar/${id}`} className="mt-4 inline-block text-sm font-semibold text-blue-600">
          Orqaga
        </Link>
      </div>
    );
  }

  const prep = await prepareTournamentSession(id);
  if (!prep.ok) {
    if (prep.code === "auth") redirect("/auth/kirish");

    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-amber-50/90 to-white px-4 py-12 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-lg">
          <h1 className="text-lg font-bold text-slate-900">Turnirga qatnashish</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{prep.message}</p>
          <p className="mt-2 text-xs text-slate-500">
            Vaqt: {formatTournamentWindowUz(tournament.startsAt, tournament.endsAt)}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/turnirlar/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 py-3 text-sm font-bold text-white shadow-md"
            >
              Turnir sahifasi
            </Link>
            <Link
              href="/turnirlar"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
            >
              Barcha turnirlar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TournamentRunnerGate
      tournamentId={id}
      testId={prep.testId}
      title={prep.title}
      durationMinutes={prep.durationMinutes}
      questions={tournament.test.questions}
      initialSession={prep.initialSession}
    />
  );
}
