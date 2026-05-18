"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Send, X } from "lucide-react";
import { submitLandingSupportMessage, type SubmitLandingSupportState } from "@/app/landing-support-actions";

const initialState: SubmitLandingSupportState = undefined;

type Props = {
  onClose: () => void;
};

export function LandingSupportModalForm({ onClose }: Props) {
  const [state, formAction, pending] = useActionState(submitLandingSupportMessage, initialState);
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
        className="relative z-10 max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-3xl border border-white/60 bg-white/95 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl"
      >
        <div className="sticky top-0 z-[1] border-b border-slate-100/90 bg-gradient-to-r from-slate-50 via-white to-violet-50/40 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p id={titleId} className="text-lg font-bold tracking-tight text-slate-900">
                24/7 yordam
              </p>
              <p id={descId} className="mt-1 text-sm leading-relaxed text-slate-600">
                Aloqa uchun telefon va murojaatingizni yozing. Javob Telegram orqali beriladi.
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
            <label htmlFor="landing-support-name" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ism (ixtiyoriy)
            </label>
            <input
              id="landing-support-name"
              name="name"
              type="text"
              maxLength={80}
              autoComplete="name"
              disabled={pending}
              placeholder="Masalan: Aziz"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label htmlFor="landing-support-phone" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Telefon
            </label>
            <input
              id="landing-support-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              disabled={pending}
              placeholder="+998 90 123 45 67"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-50"
            />
            <p className="mt-1 text-[11px] text-slate-500">O&apos;zbekiston raqami — qayta aloqa uchun.</p>
          </div>
          <div>
            <label htmlFor="landing-support-msg" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Savol yoki muammo
            </label>
            <textarea
              id="landing-support-msg"
              name="message"
              required
              rows={5}
              minLength={15}
              maxLength={2000}
              disabled={pending}
              placeholder="Nima haqida yozmoqchisiz? Kamida 15 belgi."
              className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 shadow-inner shadow-slate-200/40 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-50"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">15–2000 belgi.</p>
          </div>

          {state?.error === "badphone" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Telefon raqami noto&apos;g&apos;ri. +998 yoki 9XXXXXXXX formatida kiriting.
            </p>
          ) : null}
          {state?.error === "namelong" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Ism juda uzun.
            </p>
          ) : null}
          {state?.error === "short" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Matn juda qisqa — batafsilroq yozing (kamida 15 belgi).
            </p>
          ) : null}
          {state?.error === "long" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Matn juda uzun.
            </p>
          ) : null}
          {state?.error === "empty" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Matn bo&apos;sh bo&apos;lmasin.
            </p>
          ) : null}
          {state?.error === "rate_short" ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200/80">
              Bir ozdan so&apos;ng qayta urinib ko&apos;ring.
            </p>
          ) : null}
          {state?.error === "rate_day" ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200/80">
              Kunlik limit. Ertaga yoki boshqa kanal orqali bog&apos;laning.
            </p>
          ) : null}
          {state?.error === "notoken" ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200/80">
              Texnik sozlama yetarli emas. Keyinroq urinib ko&apos;ring.
            </p>
          ) : null}
          {state?.error === "noconfig" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Yordam kanali hozircha mavjud emas.
            </p>
          ) : null}
          {state?.error === "sendfail" ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-200/80">
              Yuborib bo&apos;lmadi. Internet aloqasini tekshiring.
            </p>
          ) : null}
          {state?.ok ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 ring-1 ring-emerald-200/80">
              Xabaringiz qabul qilindi. Tez orada bog&apos;lanamiz.
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
