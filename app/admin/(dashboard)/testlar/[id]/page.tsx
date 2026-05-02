import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestBuilderForm } from "@/components/admin/TestBuilderForm";

type Props = { params: Promise<{ id: string }> };

export default async function AdminTestEditPage({ params }: Props) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!test) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <Link
          href="/admin/testlar"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Ro&apos;yxatga qaytish
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Testni tahrirlash</h1>
        <p className="mt-1 text-slate-600">{test.title}</p>
      </div>
      <TestBuilderForm mode="edit" test={test} questions={test.questions} />
    </div>
  );
}
