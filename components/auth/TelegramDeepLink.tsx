"use client";

import { useState, useTransition } from "react";
import { createTelegramDeepLinkToken } from "@/app/auth/actions";
import { ExternalLink, Loader2 } from "lucide-react";

type Props = {
  /** Kabinetda ixcham ko‘rinish */
  variant?: "default" | "compact";
};

export function TelegramDeepLink({ variant = "default" }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onClick() {
    setErr(null);
    setUrl(null);
    start(async () => {
      const r = await createTelegramDeepLinkToken();
      if (r.error) setErr(r.error);
      else if (r.url) setUrl(r.url);
    });
  }

  return (
    <div
      className={
        variant === "compact"
          ? "rounded-xl border border-sky-100 bg-sky-50/40 p-3"
          : "rounded-xl border border-slate-100 bg-slate-50/50 p-4"
      }
    >
      {variant === "compact" ? (
        <>
          <p className="text-xs leading-relaxed text-slate-700">
            Test natijalari va yangiliklar botda ham kelishi uchun havola yarating, keyin bir marta
            oching — bot akkauntingizni bog‘laydi.
          </p>
          <button
            type="button"
            onClick={onClick}
            disabled={pending}
            className="mt-2 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-900 shadow-sm hover:bg-sky-50/80 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Havola yaratish
          </button>
        </>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-slate-900">
            2. Telegram ilovasi orqali (havola)
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Avval <span className="font-medium">Havola yaratish</span> tugmasini bosing, keyin chiqan
            havolani bitta marta oching. Telegram ochiladi va bot sizning maxsus kodingizni o&apos;zi
            oladi — <span className="font-mono whitespace-nowrap">/start</span> buyrug&apos;ini
            qo&apos;lda yozishingiz shart emas.
          </p>
          <button
            type="button"
            onClick={onClick}
            disabled={pending}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Havola yaratish
          </button>
        </>
      )}
      {err ? (
        <p className="mt-2 text-sm text-red-700">{err}</p>
      ) : null}
      {url ? (
        <div className="mt-3 space-y-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 break-all text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            Botga o&apos;tish
          </a>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Havola 24 soat ichida amal qiladi. Bot administratori ulanishni yakunlash uchun
            server sozlamalarini qilgan bo&apos;lishi kerak.
          </p>
        </div>
      ) : null}

      {variant === "default" ? (
        <details className="mt-4 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-[11px] text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-700">Dasturchilar uchun</summary>
          <p className="mt-2 leading-relaxed">
            Bot <span className="font-mono">/start</span> parametridagi tokenni olib,{" "}
            <code className="rounded bg-slate-100 px-1">POST /api/telegram/confirm-link</code> ga
            yuboradi. Sarlavha:{" "}
            <code className="rounded bg-slate-100 px-1">Authorization: Bearer TELEGRAM_BOT_API_SECRET</code>
            . Tanada: <code className="rounded bg-slate-100 px-1">token</code>,{" "}
            <code className="rounded bg-slate-100 px-1">telegramId</code>, ixtiyoriy{" "}
            <code className="rounded bg-slate-100 px-1">username</code>.
          </p>
        </details>
      ) : null}
    </div>
  );
}
