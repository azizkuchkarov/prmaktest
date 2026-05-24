import Link from "next/link";
import { TournamentBuilderCreate } from "@/components/admin/TournamentBuilderForm";

export default function AdminNewTournamentPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/turnirlar" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Turnirlar ro&apos;yxati
        </Link>
        <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">Yangi turnir</h1>
        <p className="mt-2 text-sm text-slate-600">
          Turnir vaqtini belgilang va savollarni alohida yuklang — katalog testlaridan mustaqil.
        </p>
      </div>
      <TournamentBuilderCreate />
    </div>
  );
}
