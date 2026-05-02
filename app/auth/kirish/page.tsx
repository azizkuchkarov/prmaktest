import Link from "next/link";
import { LoginForm } from "./ui";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ from?: string; misconfigured?: string; telegram?: string }> };

export default async function KirishPage({ searchParams }: Props) {
  const q = await searchParams;
  const from = typeof q.from === "string" ? q.from : undefined;
  const misconfigured = q.misconfigured === "1";
  const telegram = q.telegram;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
      <h1 className="text-center text-xl font-bold text-slate-900">Kirish</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Mobil raqam va parolingiz bilan kiring.
      </p>
      {misconfigured ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          <code className="rounded bg-amber-100/80 px-1">STUDENT_SESSION_SECRET</code>{" "}
          ni <code className="rounded bg-amber-100/80 px-1">.env</code> fayliga {"qo'shing"} (kamida 16
          belgi).
        </p>
      ) : null}
      {telegram === "need_login" ? (
        <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 ring-1 ring-blue-200">
          Telegramni ulashdan oldin tizimga kiring.
        </p>
      ) : null}
      <LoginForm redirectFrom={from} />
      <p className="mt-6 text-center text-sm text-slate-600">
        {"Hisobingiz yo'qmi?"}{" "}
        <Link href="/auth/royxatdan-otish" className="font-semibold text-blue-600 hover:text-blue-700">
          {"Ro'yxatdan o'tish"}
        </Link>
      </p>
    </div>
  );
}
