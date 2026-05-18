"use client";

import { Clock, MapPin, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  {
    icon: Clock,
    title: "Real test muhiti",
    text: "O'quvchi vaqt bilan ishlashni, savollarni tartibli yechishni va imtihon formatiga moslashishni o'rganadi.",
    accent: "from-blue-500/15 to-indigo-500/10",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    icon: Trophy,
    title: "Respublika reytingi",
    text: "Har bir testdan so'ng o'quvchi o'z natijasini butun respublika bo'yicha solishtira oladi.",
    accent: "from-amber-500/15 to-orange-500/10",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    icon: MapPin,
    title: "Viloyat bo'yicha reyting",
    text: "O'quvchi o'z viloyatidagi boshqa ishtirokchilar orasida nechanchi o'rinda ekanini ko'rib boradi.",
    accent: "from-teal-500/15 to-emerald-500/10",
    iconBg: "bg-teal-100 text-teal-600",
  },
  {
    icon: Users,
    title: "Ota-ona monitoringi",
    text: "Ota-onalar farzandining test natijalari, o'sish dinamikasi va zaif tomonlarini kuzatib borishlari mumkin.",
    accent: "from-violet-500/15 to-purple-500/10",
    iconBg: "bg-violet-100 text-violet-600",
  },
] as const;

export function Benefits() {
  return (
    <section
      id="afzalliklar"
      className="border-t border-slate-100 bg-white py-20 sm:py-24"
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
            Nima uchun aynan bu platforma?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Tayyorgarlikni tizimli qilish uchun asosiy afzalliklar.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 1, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br ${item.accent} p-6 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 transition-shadow hover:shadow-xl hover:shadow-slate-200/60`}
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg} shadow-sm transition-transform group-hover:scale-105`}
              >
                <item.icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="break-words text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
