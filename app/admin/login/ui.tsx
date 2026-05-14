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
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 shadow-inner shadow-slate-200/40 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/25"
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
        className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-3 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-105 active:brightness-95 disabled:opacity-60"
      >
        {pending ? "Kirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
