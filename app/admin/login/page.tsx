import { Shield } from "lucide-react";
import { LoginForm } from "./ui";

type Props = { searchParams: Promise<{ from?: string; misconfigured?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const from = typeof q.from === "string" ? q.from : undefined;
  const misconfigured = q.misconfigured === "1";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.18),transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(124,58,237,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-violet-500/30">
            <Shield className="size-8" aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Admin kirish</h1>
          <p className="mt-2 text-sm text-slate-600">
            Yangiliklar va testlarni boshqarish uchun maxfiy parol kiriting
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-300/30 backdrop-blur-sm">
          {misconfigured ? (
            <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-200/80">
              Muhit o&apos;zgaruvchilari to&apos;liq emas.{" "}
              <code className="rounded bg-amber-100/90 px-1 font-mono text-xs">ADMIN_SECRET</code> va{" "}
              <code className="rounded bg-amber-100/90 px-1 font-mono text-xs">ADMIN_PASSWORD</code>{" "}
              ni <code className="rounded bg-amber-100/90 px-1 font-mono text-xs">.env</code> faylida
              o&apos;rnating.
            </p>
          ) : null}
          <LoginForm redirectFrom={from} />
        </div>
      </div>
    </div>
  );
}
