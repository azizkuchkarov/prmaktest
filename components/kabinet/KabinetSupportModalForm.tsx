"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Send, X } from "lucide-react";
import { submitKabinetSupportMessage, type SubmitKabinetSupportState } from "@/app/kabinet/support-actions";

const initialState: SubmitKabinetSupportState = undefined;

type Props = {
  onClose: () => void;
};

export function KabinetSupportModalForm({ onClose }: Props) {
  const [state, formAction, pending] = useActionState(submitKabinetSupportMessage, initialState);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (state?.ok) {
      const t = window.setTimeout(() => onClose(), 2200);
      return () => window.clearTimeout(t);
    }
  }, [state?.ok, onClose]);

  return (
    <div className="fixed inset-0 z-[10070] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Yopish"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl"
      >
        <div className="border-b border-slate-100/90 bg-gradient-to-r from-slate-50 via-white to-violet-50/40 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p id={titleId} className="text-lg font-bold tracking-tight text-slate-900">
                24/7 yordam
              </p>
              <p id={descId} className="mt-1 text-sm leading-relaxed text-slate-600">
                Muammoingizni batafsil yozing. Xabaringiz faqat texnik qo&apos;llab-quvvatlash jamoasiga yuboriladi.
              </p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
              aria-label="Yopish"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <form action={formAction} className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <div>
            <label htmlFor="support-msg" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Muammo tavsifi
            </label>
            <textarea
              id="support-msg"
              name="message"
              required
              rows={6}
              minLength={15}
              maxLength={2000}
              disabled={pending}
              placeholder="Nima sodir bo‘lyapti? Qaysi sahifa yoki test? Xabar matni kamida 15 belgi."
              className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 shadow-inner shadow-slate-200/40 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-50"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">15–2000 belgi. Spam oldini olish: qisqa tanaffuslar bilan yuborish mumkin.</p>
          </div>

          {state?.error === "auth" ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200/80">
              Sessiya muddati tugagan. Qayta kiring.
            </p>
          ) : null}
          {state?.error === "short" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Matn juda qisqa. Iltimos, batafsilroq yozing (kamida 15 belgi).
            </p>
          ) : null}
          {state?.error === "long" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Matn juda uzun. Qisqartirib yuboring.
            </p>
          ) : null}
          {state?.error === "empty" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Matn bo&apos;sh bo&apos;lmasin.
            </p>
          ) : null}
          {state?.error === "rate_short" ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200/80">
              Bir ozdan so&apos;ng qayta urinib ko&apos;ring — xabarlar orasida qisqa pauza talab qilinadi.
            </p>
          ) : null}
          {state?.error === "rate_day" ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200/80">
              Kunlik yordam so&apos;rovlari limiti to&apos;ldi. Ertaga yoki boshqa aloqa kanali orqali bog&apos;laning.
            </p>
          ) : null}
          {state?.error === "notoken" ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200/80">
              Serverda bot token sozlanmagan. Administratorga xabar bering.
            </p>
          ) : null}
          {state?.error === "noconfig" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Yordam kanali hali ulangan emas. Keyinroq urinib ko&apos;ring.
            </p>
          ) : null}
          {state?.error === "sendfail" ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200/80">
              Yuborib bo&apos;lmadi. Internet yoki Telegram tomonda vaqtinchalik muammo bo&apos;lishi mumkin.
            </p>
          ) : null}
          {state?.ok ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 ring-1 ring-emerald-200/80">
              Xabaringiz qabul qilindi. Tez orada javob beramiz.
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden />
              {pending ? "Yuborilmoqda…" : "Yuborish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
