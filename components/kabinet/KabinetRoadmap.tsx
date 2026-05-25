"use client";

import { BookOpenCheck, CalendarDays, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    phase: "1-bosqich",
    title: "3 ta mock test",
    description:
      "Saytga kirganingizdan so‘ng uchta mock testni yechasiz. Natijalar asosida Respublika va viloyat bo‘yicha o‘rningiz shakllana boshlaydi — keyingi qadamga tayyorlanish uchun ideal mashg‘ulot.",
    Icon: BookOpenCheck,
    gradient: "from-[#2563EB] via-[#0ea5e9] to-[#06b6d4]",
    ring: "ring-blue-500/20",
    chip: "Mock",
    chipClass: "bg-blue-50 text-blue-800 ring-blue-200/80",
  },
  {
    phase: "2-bosqich",
    title: "Haftalik real testlar",
    description:
      "Mock bosqichdan keyin real testlar boshlanadi. Har hafta seshanba, payshanba va shanba kunlari yangi to‘plamlar joylanadi; shu orqali reytingingizni har kuni mustahkamlab borasiz.",
    Icon: CalendarDays,
    gradient: "from-[#7C3AED] via-[#a855f7] to-[#c026d3]",
    ring: "ring-violet-500/20",
    chip: "Haftalik",
    chipClass: "bg-violet-50 text-violet-900 ring-violet-200/80",
    schedule: ["Seshanba", "Payshanba", "Shanba"],
  },
  {
    phase: "Imtihon",
    title: "1-bosqich imtihoni",
    description:
      "24-iyun kuni 1-bosqich imtihoni boshlanadi. Shu sanadan oldin real testlar va kabinetdagi reyting orqali tayyorgarlikni davom ettirish tavsiya etiladi.",
    Icon: GraduationCap,
    gradient: "from-[#ea580c] via-[#f59e0b] to-[#fbbf24]",
    ring: "ring-amber-500/25",
    chip: "24-iyun",
    chipClass: "bg-amber-50 text-amber-950 ring-amber-200/90",
    highlightDate: "24-iyun",
  },
] as const;

export function KabinetRoadmap() {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem]",
        "border border-white/70 bg-white/85 shadow-[0_22px_60px_-18px_rgba(37,99,235,0.18),0_12px_32px_-12px_rgba(15,23,42,0.14)]",
        "ring-1 ring-slate-200/60 backdrop-blur-xl",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.65]" aria-hidden>
        <div className="absolute -left-1/4 -top-24 h-72 w-[140%] bg-[radial-gradient(ellipse_at_30%_0%,rgba(37,99,235,0.14),transparent_55%)]" />
        <div className="absolute -right-1/4 top-1/3 h-64 w-[120%] bg-[radial-gradient(ellipse_at_70%_50%,rgba(124,58,237,0.12),transparent_50%)]" />
        <div className="absolute bottom-0 left-1/2 h-48 w-full max-w-2xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgba(245,158,11,0.08),transparent_60%)]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,transparent_42%,rgba(255,255,255,0.15)_100%)]"
        aria-hidden
      />

      <div className="relative px-5 pb-7 pt-6 sm:px-7">
          <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
            Platformada qatnashish <strong className="font-semibold text-slate-800">ketma-ket bosqichlar</strong>{" "}
            bo‘lib o‘tadi. Har bir bosqichda kabinetidagi{" "}
            <strong className="font-semibold text-slate-800">reyting</strong> yangilanadi — mockdan imtihongacha
            bir xil tizimda kuzating.
          </p>

          <div className="relative mx-auto mt-10 max-w-3xl">
            <ul className="relative space-y-4 sm:space-y-5">
              {STEPS.map((step, i) => {
                const Icon = step.Icon;
                const isLast = i === STEPS.length - 1;
                return (
                  <li
                    key={step.phase}
                    className="grid grid-cols-[2.75rem_1fr] items-stretch gap-3 sm:grid-cols-[3.25rem_1fr] sm:gap-5"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={cn(
                          "relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white sm:h-12 sm:w-12",
                          "bg-gradient-to-br",
                          step.gradient,
                          "ring-4 ring-white shadow-md shadow-slate-900/15",
                        )}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} aria-hidden />
                      </div>
                      {!isLast ? (
                        <div
                          className="mt-1 w-px flex-1 min-h-[1.25rem] bg-gradient-to-b from-slate-300/80 via-slate-200/90 to-slate-200/70 sm:min-h-[1.5rem]"
                          aria-hidden
                        />
                      ) : null}
                    </div>

                    <article
                      className={cn(
                        "group/step relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm",
                        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB]/25 hover:shadow-lg hover:shadow-slate-900/6 sm:p-5",
                        step.ring,
                      )}
                    >
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-90",
                          step.gradient,
                        )}
                      />
                      <div className="relative pl-3 sm:pl-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                              step.chipClass,
                            )}
                          >
                            {step.chip}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {step.phase}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{step.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">{step.description}</p>

                        {"schedule" in step && step.schedule ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {step.schedule.map((day) => (
                              <span
                                key={day}
                                className="inline-flex items-center rounded-xl bg-gradient-to-br from-violet-50 to-white px-3 py-1.5 text-xs font-bold text-violet-950 ring-1 ring-violet-200/80 shadow-sm shadow-violet-500/5"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {"highlightDate" in step && step.highlightDate ? (
                          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 ring-1 ring-amber-200/80">
                            <span className="text-xs font-bold uppercase tracking-wide text-amber-800">Sana</span>
                            <span className="text-sm font-black tabular-nums text-amber-950">{step.highlightDate}</span>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
      </div>
    </div>
  );
}
