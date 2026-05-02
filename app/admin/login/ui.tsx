"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";

type Props = { redirectFrom?: string };

export function LoginForm({ redirectFrom }: Props) {
  const [state, formAction, pending] = useActionState(adminLogin, undefined);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {redirectFrom ? (
        <input type="hidden" name="from" value={redirectFrom} />
      ) : null}
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
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4"
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
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Kirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
