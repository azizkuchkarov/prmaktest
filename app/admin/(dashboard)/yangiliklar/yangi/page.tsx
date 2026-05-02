import Link from "next/link";
import { NewsFormCreate } from "../news-form";

export default function AdminNewsNewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/yangiliklar"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Ro&apos;yxatga qaytish
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Yangi yangilik</h1>
        <p className="mt-1 text-slate-600">Sarlavha, qisqacha va to&apos;liq matn.</p>
      </div>
      <NewsFormCreate />
    </div>
  );
}
