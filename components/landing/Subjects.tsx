"use client";

import {
  Brain,
  Calculator,
  Lightbulb,
  MessageCircle,
  Puzzle,
} from "lucide-react";
import { motion } from "framer-motion";

const subjects = [
  { label: "Matematika", icon: Calculator, gradient: "from-blue-500 to-indigo-600" },
  { label: "Mantiqiy fikrlash", icon: Brain, gradient: "from-teal-500 to-cyan-600" },
  {
    label: "Tanqidiy fikrlash",
    icon: Lightbulb,
    gradient: "from-amber-500 to-orange-500",
  },
  { label: "Ingliz tili", icon: MessageCircle, gradient: "from-violet-500 to-purple-600" },
  { label: "Muammoli masalalar", icon: Puzzle, gradient: "from-rose-500 to-pink-600" },
] as const;

export function Subjects() {
  return (
    <section id="fanlar" className="bg-white py-20 sm:py-24">
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Imtihonga tayyorlanish yo&apos;nalishlari
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Asosiy fanlar va ko&apos;nikmalar bo&apos;yicha testlar.
          </p>
        </motion.div>

        <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-center lg:gap-4">
          {subjects.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 1, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.04 }}
              className="flex min-h-[132px] w-full flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/40 ring-1 ring-slate-50 sm:min-h-0 sm:gap-3 sm:p-6 lg:min-w-[180px] lg:flex-none"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg`}
              >
                <s.icon className="h-7 w-7" aria-hidden />
              </span>
              <p className="text-center text-sm font-semibold text-slate-900 sm:text-base">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
