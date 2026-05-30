import Link from "next/link";
import { RegisterRolePicker } from "@/components/auth/RegisterRolePicker";

export const dynamic = "force-dynamic";

export default function RoyxatRolePage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <h1 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">
        Ro&apos;yxatdan o&apos;tish
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
        Avval kim sifatida ro&apos;yxatdan o&apos;tayotganingizni tanlang.
      </p>
      <div className="mt-8">
        <RegisterRolePicker />
      </div>
      <p className="mt-8 text-center text-sm text-slate-600">
        Akkauntingiz bormi?{" "}
        <Link href="/auth/kirish" className="font-semibold text-blue-600 hover:text-blue-700">
          Kirish
        </Link>
      </p>
    </div>
  );
}
