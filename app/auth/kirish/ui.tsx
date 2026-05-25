"use client";

import { useActionState, useState } from "react";
import { loginStudent, type AuthFormState } from "../actions";

type Props = { redirectFrom?: string };

const PHONE_PREFIX = "+998 ";

function allowSafeReturn(from: string): boolean {
  if (!from.startsWith("/") || from.startsWith("//") || from.includes("..")) return false;
  if (from.startsWith("/kabinet")) return true;
  if (from.startsWith("/oqituvchi")) return true;
  if (/^\/testlar\/[^/]+\/boshlash$/.test(from)) return true;
  if (from.startsWith("/turnirlar")) return true;
  return false;
}

function buildPhoneDisplay(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  const body = d.slice(0, 9);
  return PHONE_PREFIX + body;
}

export function LoginForm({ redirectFrom }: Props) {
  const [state, formAction, pending] = useActionState(loginStudent, undefined as AuthFormState);
  const [phone, setPhone] = useState(PHONE_PREFIX);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {redirectFrom && allowSafeReturn(redirectFrom) ? (
        <input type="hidden" name="from" value={redirectFrom} />
      ) : null}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
          Mobil raqam
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          autoComplete="tel"
          placeholder="+998 90 123 45 67"
          minLength={14}
          title="To‘liq raqam: +998 va 9 ta raqam"
          value={phone}
          onChange={(e) => setPhone(buildPhoneDisplay(e.target.value))}
          className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Parol
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        />
      </div>
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 py-3 text-base font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Kirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
