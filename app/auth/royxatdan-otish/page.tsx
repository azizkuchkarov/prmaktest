import Link from "next/link";
import { RegisterForm } from "./ui";

export const dynamic = "force-dynamic";

export default function RoyxatPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
      <h1 className="text-center text-xl font-bold text-slate-900">{"Ro'yxatdan o'tish"}</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Mobil telefon raqami, parol va viloyatni kiriting. Tasdiqlash kodi (OTP) yuborilmaydi.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-slate-600">
        Akkauntingiz bormi?{" "}
        <Link href="/auth/kirish" className="font-semibold text-blue-600 hover:text-blue-700">
          Kirish
        </Link>
      </p>
    </div>
  );
}
