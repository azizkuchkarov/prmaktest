import { LoginForm } from "./ui";

type Props = { searchParams: Promise<{ from?: string; misconfigured?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const from = typeof q.from === "string" ? q.from : undefined;
  const misconfigured = q.misconfigured === "1";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <h1 className="text-center text-xl font-bold text-slate-900">Admin kirish</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Yangiliklar va testlarni boshqarish
        </p>
        {misconfigured ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
            Muhit o&apos;zgaruvchilari to&apos;liq emas.{" "}
            <code className="rounded bg-amber-100/80 px-1">ADMIN_SECRET</code> va{" "}
            <code className="rounded bg-amber-100/80 px-1">ADMIN_PASSWORD</code>{" "}
            ni <code className="rounded bg-amber-100/80 px-1">.env</code> faylida
            o&apos;rnating.
          </p>
        ) : null}
        <LoginForm redirectFrom={from} />
      </div>
    </div>
  );
}
