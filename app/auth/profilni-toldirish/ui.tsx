"use client";

import { useActionState } from "react";
import { completeStudentProfile, type ProfileFormState } from "../actions";

export function ProfileSetupForm() {
  const [state, formAction, pending] = useActionState(completeStudentProfile, undefined as ProfileFormState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
          Ism <span className="text-red-600">*</span>
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          required
          minLength={2}
          maxLength={60}
          autoComplete="given-name"
          placeholder="Masalan: Ali"
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
          Familiya <span className="text-red-600">*</span>
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          required
          minLength={2}
          maxLength={60}
          autoComplete="family-name"
          placeholder="Masalan: Valiyev"
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        />
      </div>
      <div>
        <label htmlFor="parentPhone" className="block text-sm font-medium text-slate-700">
          Ota-onaning mobil raqami <span className="text-red-600">*</span>
        </label>
        <input
          id="parentPhone"
          name="parentPhone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+998 90 000 00 00"
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        />
        <p className="mt-1 text-xs text-slate-500">
          {"Monitoring va kelajakdagi SMS/Telegram xabarnomalar uchun. O'quvchi raqamidan farq qilishi kerak."}
        </p>
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
        {pending ? "Saqlanmoqda…" : "Davom etish"}
      </button>
    </form>
  );
}
