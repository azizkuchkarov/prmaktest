"use client";

import { useActionState, useState } from "react";
import { registerStudent, type AuthFormState } from "../actions";
import { VILOYATLAR } from "@/lib/viloyats";
import { STUDENT_GRADES } from "@/lib/student-grade";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerStudent, undefined as AuthFormState);
  const [asTeacher, setAsTeacher] = useState(false);

  return (
    <form action={formAction} className="mt-8 space-y-4">
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
          className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        />
      </div>
      <div>
        <label htmlFor="viloyat" className="block text-sm font-medium text-slate-700">
          Viloyat
        </label>
        <select
          id="viloyat"
          name="viloyat"
          required
          defaultValue=""
          className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        >
          <option value="" disabled>
            Tanlang…
          </option>
          {VILOYATLAR.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
          <input
            type="checkbox"
            name="asTeacher"
            checked={asTeacher}
            onChange={(e) => setAsTeacher(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <span className="font-medium">Men o‘qituvchiman</span>
            <span className="mt-1 block text-slate-600">
              Ro‘yxatdan keyin admin tasdig‘ini kutasiz. Virtual sinf va testlar shu bo‘limda ochiladi.
            </span>
          </span>
        </label>
      </div>
      {asTeacher ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="teacherFirstName" className="block text-sm font-medium text-slate-700">
              Ism
            </label>
            <input
              id="teacherFirstName"
              name="teacherFirstName"
              type="text"
              required
              autoComplete="given-name"
              minLength={2}
              maxLength={80}
              placeholder="Masalan: Ali"
              className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
            />
          </div>
          <div>
            <label htmlFor="teacherLastName" className="block text-sm font-medium text-slate-700">
              Familiya
            </label>
            <input
              id="teacherLastName"
              name="teacherLastName"
              type="text"
              required
              autoComplete="family-name"
              minLength={2}
              maxLength={80}
              placeholder="Masalan: Karimov"
              className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
            />
          </div>
        </div>
      ) : null}
      {!asTeacher ? (
        <div>
          <label htmlFor="gradeLevel" className="block text-sm font-medium text-slate-700">
            Sinf
          </label>
          <select
            id="gradeLevel"
            name="gradeLevel"
            required
            defaultValue=""
            className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          >
            <option value="" disabled>
              3–9-sinfni tanlang…
            </option>
            {STUDENT_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}-sinf
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Parol (kamida 8 belgi)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
        />
      </div>
      <div>
        <label htmlFor="password2" className="block text-sm font-medium text-slate-700">
          Parolni tasdiqlang
        </label>
        <input
          id="password2"
          name="password2"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Yaratilmoqda…" : "Ro'yxatdan o'tish"}
      </button>
    </form>
  );
}
