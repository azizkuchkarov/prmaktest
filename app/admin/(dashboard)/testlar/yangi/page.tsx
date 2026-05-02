import Link from "next/link";
import { TestBuilderForm } from "@/components/admin/TestBuilderForm";

export default function AdminTestNewPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <Link
          href="/admin/testlar"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Ro&apos;yxatga qaytish
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Yangi test</h1>
        <p className="mt-1 text-slate-600">
          1-bosqich (saralash): savollar, A–D variantlar, to&apos;g&apos;ri javob va yechim.
        </p>
      </div>
      <TestBuilderForm mode="create" />
    </div>
  );
}
