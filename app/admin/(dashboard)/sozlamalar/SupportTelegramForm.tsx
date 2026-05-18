"use client";

import { useActionState } from "react";
import type { SupportSettingsState } from "./actions";

type Props = {
  defaultChatId: string;
  saveAction: (
    prev: SupportSettingsState | undefined,
    formData: FormData,
  ) => Promise<SupportSettingsState | undefined>;
};

export function SupportTelegramForm({ defaultChatId, saveAction }: Props) {
  const [state, formAction, pending] = useActionState(saveAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="supportTelegramChatId" className="block text-xs font-semibold text-slate-600">
          Chat ID
        </label>
        <input
          id="supportTelegramChatId"
          name="supportTelegramChatId"
          type="text"
          inputMode="numeric"
          defaultValue={defaultChatId}
          placeholder="Masalan: 123456789 yoki -1001234567890"
          autoComplete="off"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
        />
      </div>

      {state?.error === "auth" ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200/80">
          Sessiya tugagan. Admin panelda qayta kiring.
        </p>
      ) : null}

      {state?.error === "invalid" ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200/80">
          Chat ID faqat butun son bo&apos;lishi kerak (masalan shaxsiy — musbat, kanal — odatda{" "}
          <span className="font-mono">-100…</span>).
        </p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200/80">
          Saqlandi. Kabinet sahifasida yordam tugmasi yangilanadi.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </button>
    </form>
  );
}
