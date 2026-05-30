"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegisterIntroStep } from "@/components/auth/register-intro-content";
import { REGISTER_INTRO_ICONS } from "@/components/auth/register-intro-icons";
import { RegisterForm } from "@/app/auth/royxatdan-otish/ui";

type Props = {
  variant: "student" | "teacher";
  heading: string;
  lead: string;
  steps: RegisterIntroStep[];
  backHref?: string;
};

export function RegisterIntroFlow({
  variant,
  heading,
  lead,
  steps,
  backHref = "/auth/royxatdan-otish",
}: Props) {
  const [phase, setPhase] = useState<"intro" | "register">("intro");
  const [agreed, setAgreed] = useState(false);

  const accent =
    variant === "student"
      ? {
          badge: "bg-blue-100 text-blue-800",
          icon: "bg-blue-500/10 text-blue-700 ring-blue-200/80",
          btn: "from-blue-600 to-teal-600",
          agree: "text-blue-600 focus:ring-blue-500",
        }
      : {
          badge: "bg-violet-100 text-violet-800",
          icon: "bg-violet-500/10 text-violet-700 ring-violet-200/80",
          btn: "from-violet-600 to-indigo-600",
          agree: "text-violet-600 focus:ring-violet-500",
        };

  if (phase === "register") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setPhase("intro")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Tanishtiruvga qaytish
        </button>
        <h1 className="text-center text-xl font-bold text-slate-900">{heading}</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {variant === "student"
            ? "Mobil raqam, parol va sinfni kiriting."
            : "Mobil raqam, ism-familiya va parolni kiriting."}
        </p>
        <RegisterForm variant={variant} />
        <p className="mt-6 text-center text-sm text-slate-600">
          Akkauntingiz bormi?{" "}
          <Link href="/auth/kirish" className="font-semibold text-blue-600 hover:text-blue-700">
            Kirish
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Orqaga
      </Link>

      <div className="text-center">
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
            accent.badge,
          )}
        >
          {variant === "student" ? "O‘quvchi" : "O‘qituvchi"}
        </span>
        <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">{heading}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{lead}</p>
      </div>

      <ul className="mt-8 space-y-4">
        {steps.map((step, i) => {
          const Icon = REGISTER_INTRO_ICONS[step.icon];
          return (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-sm"
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
                  accent.icon,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {i + 1}-qadam
                </p>
                <p className="mt-0.5 font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className={cn("mt-0.5 size-4 shrink-0 rounded border-slate-300", accent.agree)}
          />
          <span>
            <span className="font-semibold">Men roziman</span>
            <span className="mt-1 block text-slate-600">
              Platforma qoidalariga roziman va{" "}
              {variant === "student" ? "o‘quvchi" : "o‘qituvchi"} sifatida ro‘yxatdan o‘tishni
              xohlayman.
            </span>
          </span>
        </label>
      </div>

      <button
        type="button"
        disabled={!agreed}
        onClick={() => setPhase("register")}
        className={cn(
          "mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-3 text-base font-semibold text-white shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50",
          accent.btn,
        )}
      >
        <CheckCircle2 className="size-5" aria-hidden />
        Ro‘yxatdan o‘tishni boshlash
      </button>

      <p className="mt-6 text-center text-sm text-slate-600">
        Akkauntingiz bormi?{" "}
        <Link href="/auth/kirish" className="font-semibold text-blue-600 hover:text-blue-700">
          Kirish
        </Link>
      </p>
    </div>
  );
}
