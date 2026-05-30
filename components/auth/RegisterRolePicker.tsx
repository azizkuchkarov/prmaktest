"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDENT_ROLE_CARD, TEACHER_ROLE_CARD } from "@/components/auth/register-intro-content";
import { REGISTER_INTRO_ICONS } from "@/components/auth/register-intro-icons";

const cards = [STUDENT_ROLE_CARD, TEACHER_ROLE_CARD] as const;

export function RegisterRolePicker() {
  return (
    <div className="space-y-4">
      {cards.map((card, index) => {
        const Icon = REGISTER_INTRO_ICONS[card.icon];
        const isStudent = index === 0;
        return (
          <Link
            key={card.href}
            href={card.href}
            className={cn(
              "group flex items-start gap-4 rounded-2xl border p-5 shadow-sm transition",
              isStudent
                ? "border-blue-200/90 bg-gradient-to-br from-blue-50/90 to-white hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/60"
                : "border-violet-200/90 bg-gradient-to-br from-violet-50/90 to-white hover:border-violet-300 hover:shadow-md hover:shadow-violet-100/60",
            )}
          >
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm",
                isStudent
                  ? "bg-gradient-to-br from-blue-500 to-teal-500 text-white"
                  : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
              )}
            >
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900">{card.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{card.description}</p>
            </div>
            <ChevronRight
              className="mt-1 size-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
