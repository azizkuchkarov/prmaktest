"use client";

import { CalendarDays, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const schedule = [
  "3 ta boshlang'ich Mock Test",
  "Seshanba: asosiy test",
  "Payshanba: mantiqiy test",
  "Shanba: umumiy test",
  "Yakshanba: bonus test",
] as const;

export function TestSchedule() {
  return (
    <section
      id="jadval"
      className="border-t border-slate-100 bg-gradient-to-br from-blue-50/50 via-white to-teal-50/40 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <motion.div
            initial={{ opacity: 1, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm ring-1 ring-blue-100">
              <CalendarDays className="h-4 w-4" aria-hidden />
              Haftalik tuzilma
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Rejali tayyorgarlik tizimi
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              O&apos;quvchi dastlab mock testlardan o&apos;tadi. Keyin esa hafta
              davomida belgilangan kunlarda yangi testlar orqali tayyorgarlikni
              davom ettiradi.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 1, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-white/90 bg-white p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 sm:p-8"
          >
            <p className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Namunaviy jadval
            </p>
            <ul className="space-y-4">
              {schedule.map((line, i) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-teal-500"
                    aria-hidden
                  />
                  <span className="flex-1 text-base font-medium text-slate-800">
                    {line}
                  </span>
                  {i === 0 ? (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Boshlanish
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
