"use client";

import { BookOpen, LineChart, ListChecks, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const cards = [
  {
    title: "Testlar tarixi",
    text: "Qaysi testlar yechilgani va vaqt oralig'i.",
    icon: ListChecks,
  },
  {
    title: "Natijalar dinamikasi",
    text: "Ball va muvaffaqiyat grafigi bo'yicha o'sish.",
    icon: LineChart,
  },
  {
    title: "Zaif mavzular",
    text: "Qaysi bo'limlarda qo'shimcha mashq kerakligi.",
    icon: BookOpen,
  },
  {
    title: "Farzand progressi",
    text: "Umumiy tayyorgarlik foizi va maqsadlar.",
    icon: TrendingUp,
  },
] as const;

export function ParentMonitoring() {
  return (
    <section
      id="ota-ona"
      className="border-t border-slate-100 bg-gradient-to-b from-violet-50/40 via-white to-sky-50/30 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ota-onalar uchun monitoring imkoniyati
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
            Ota-onalar farzandining qaysi testlarni yechgani, nechta ball olgani,
            qaysi fanlarda kuchli yoki sust ekanini kuzatib borishi mumkin. Bu
            farzandning tayyorgarlik jarayonini nazorat qilish va kerakli
            yo&apos;nalishda yordam berish imkonini beradi.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <motion.article
              key={c.title}
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100 backdrop-blur-sm transition-shadow hover:shadow-xl"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-50 text-violet-600">
                <c.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
