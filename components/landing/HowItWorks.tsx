"use client";

import {
  BarChart2,
  CalendarCheck,
  ClipboardList,
  LineChart,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    step: 1,
    title: "Ro'yxatdan o'tish",
    text: "O'quvchi telefon raqam yoki boshqa qulay usul orqali platformaga kiradi.",
    icon: UserPlus,
  },
  {
    step: 2,
    title: "Boshlang'ich mock testlar",
    text: "O'quvchi dastlabki testlarni yechib, o'zining boshlang'ich darajasini aniqlaydi.",
    icon: ClipboardList,
  },
  {
    step: 3,
    title: "Haftalik testlar",
    text: "Platformada belgilangan kunlarda yangi testlar ochiladi.",
    icon: CalendarCheck,
  },
  {
    step: 4,
    title: "Natija va tahlil",
    text: "Har bir testdan keyin o'quvchi ball, to'g'ri/noto'g'ri javoblar va yechimlarni ko'radi.",
    icon: BarChart2,
  },
  {
    step: 5,
    title: "Reytingni kuzatish",
    text: "O'quvchi respublika va viloyat bo'yicha o'z o'rnini kuzatib boradi.",
    icon: LineChart,
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="qanday-ishlaydi"
      className="scroll-mt-sticky-page bg-gradient-to-b from-slate-50/80 to-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl pad-x-page">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Qanday ishlaydi?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Beshta oddiy qadam — aniq yo&apos;l xaritasi.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <div
            className="absolute left-[1.125rem] top-6 bottom-6 w-px bg-gradient-to-b from-blue-200 via-teal-200 to-violet-200 sm:left-6"
            aria-hidden
          />
          <ul className="relative space-y-0">
          {steps.map((s, i) => (
            <motion.li
              key={s.step}
              initial={{ opacity: 1, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="relative flex gap-5 pb-12 last:pb-0 sm:gap-8"
            >
              <div className="relative z-10 flex shrink-0 flex-col items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-600 to-teal-500 text-sm font-bold text-white shadow-md shadow-blue-500/30 sm:h-12 sm:w-12 sm:text-base">
                  {s.step}
                </span>
              </div>
              <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50 transition-shadow hover:shadow-lg sm:p-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                    <s.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  {s.text}
                </p>
              </div>
            </motion.li>
          ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
