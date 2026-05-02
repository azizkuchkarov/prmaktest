"use client";

import { useActionState } from "react";
import { loginStudent, type AuthFormState } from "../actions";

type Props = { redirectFrom?: string };

export function LoginForm({ redirectFrom }: Props) {
  const [state, formAction, pending] = useActionState(loginStudent, undefined as AuthFormState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {redirectFrom && redirectFrom.startsWith("/kabinet") ? (
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
          required
          autoComplete="tel"
          placeholder="+998 90 123 45 67"
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
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
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
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
        className="min-h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 py-3 text-base font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Kirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
