"use client";

import { useState, useTransition } from "react";
import { lookupTeacherClassesByPhone, requestJoinVirtualClassForm } from "./actions";

export function JoinVirtualClassSection() {
  const [pending, start] = useTransition();
  const [phone, setPhone] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [pickedClassId, setPickedClassId] = useState("");
  const [preview, setPreview] = useState<{
    phone998: string;
    classes: { id: string; label: string }[];
  } | null>(null);

  const lookupAction = () => {
    setLookupError(null);
    start(async () => {
      const r = await lookupTeacherClassesByPhone(phone);
      if (!r.ok) {
        setPreview(null);
        setLookupError(r.message);
        return;
      }
      setPreview({
        phone998: r.phone998,
        classes: r.classes.map((c) => ({ id: c.id, label: c.label })),
      });
      setPickedClassId(r.classes[0]?.id ?? "");
    });
  };

  const canJoin = preview && preview.classes.length > 0 && pickedClassId;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">O‘qituvchi sinfiga qoʻshilish</h2>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">O‘qituvchi telefon</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 ..."
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:border-emerald-500 focus:ring-4"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={lookupAction}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Qidirilyapti…" : "Sinf topish"}
        </button>
      </div>

      {lookupError ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          {lookupError}
        </p>
      ) : null}

      {preview ? (
        <form action={requestJoinVirtualClassForm} className="mt-5 space-y-3 border-t border-emerald-200/70 pt-4">
          <input type="hidden" name="teacherPhone998" value={preview.phone998} />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Qaysi virtual sinfxonaga qoʻshilmoqchisiz? (bir nechta boʻlsa majburiy tanlov)
            </label>
            <select
              name="virtualClassId"
              required
              value={pickedClassId}
              onChange={(e) => setPickedClassId(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500/15 focus:border-emerald-500 focus:ring-4"
            >
              {preview.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!canJoin}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-45 sm:w-auto sm:px-6"
          >
            Qoʻshilish so‘rovi yuborish
          </button>
        </form>
      ) : null}
    </div>
  );
}
