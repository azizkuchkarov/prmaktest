"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { createClickTopUpSession } from "@/app/kabinet/click-actions";
import { formatUzInteger } from "@/lib/format-uzs";
import { cn } from "@/lib/utils";

const PRESETS = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000] as const;

type Props = {
  className?: string;
};

export function KabinetBalanceClick({ className }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pay = (amountSum: number) => {
    setMessage(null);
    startTransition(async () => {
      const res = await createClickTopUpSession(amountSum);
      if (!res.ok) {
        setOpen(true);
        if (res.error === "auth") setMessage("Qayta kiring.");
        else if (res.error === "click_not_configured")
          setMessage("CLICK hali sozlanmagan (server .env).");
        else setMessage("Summani tekshiring (1 000 – 50 000 000 so‘m).");
        return;
      }
      window.location.href = res.url;
    });
  };

  const payCustom = () => {
    const n = Number(String(custom).replace(/\s/g, ""));
    pay(n);
  };

  return (
    <div
      id="balans-topup"
      className={cn(
        "rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white ring-1 ring-amber-100/60",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="balans-topup-panel"
        className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:bg-amber-50/50 sm:p-5 [touch-action:manipulation]"
      >
        <span className="flex min-w-0 items-center gap-2 text-amber-950">
          <Wallet className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-bold">Balans to‘ldirish (CLICK)</span>
            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-amber-900/80">
              {open
                ? "Yopish uchun bosing."
                : "Ochish — summa tanlash va CLICK orqali to‘lov."}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-amber-800/80 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div id="balans-topup-panel" className="border-t border-amber-200/60 px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
          <p className="text-xs leading-relaxed text-amber-900/85">
            Summani tanlang yoki kiriting — CLICK sahifasiga o‘tasiz. To‘lovdan keyin balans avtomatik yangilanadi.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((a) => (
              <button
                key={a}
                type="button"
                disabled={pending}
                onClick={() => pay(a)}
                className="min-h-10 rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-950 ring-1 ring-amber-200/90 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
              >
                {formatUzInteger(a)} so‘m
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-stretch gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Boshqa summa (so‘m)"
              value={custom}
              disabled={pending}
              onChange={(e) => setCustom(e.target.value)}
              className="min-h-10 min-w-[8rem] flex-1 rounded-xl border border-amber-200/90 bg-white px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="button"
              disabled={pending}
              onClick={payCustom}
              className="min-h-10 shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-sm font-bold text-white shadow-md disabled:opacity-50"
            >
              To‘lash
            </button>
          </div>
          {message ? <p className="mt-2 text-xs font-semibold text-red-600">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
