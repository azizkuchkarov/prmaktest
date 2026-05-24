import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TournamentBuilderEdit } from "@/components/admin/TournamentBuilderForm";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditTournamentPage({ params }: Props) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      test: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!tournament) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/turnirlar" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Turnirlar ro&apos;yxati
        </Link>
        <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">Turnirni tahrirlash</h1>
        <p className="mt-2 text-sm text-slate-600">
          Vaqt va turnir savollarini yangilang. Katalog testlari bilan bog‘liq emas.
        </p>
      </div>
      <TournamentBuilderEdit
        tournament={tournament}
        test={tournament.test}
        questions={tournament.test.questions}
      />
    </div>
  );
}
