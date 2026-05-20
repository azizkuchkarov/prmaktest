"use client";

import { ArrowUpRight, Globe2, MapPinned } from "lucide-react";
import { motion } from "framer-motion";
import { rankingRows } from "./mock-data";

export function Ranking() {
  return (
    <section id="reyting" className="scroll-mt-sticky-page w-full min-w-0 overflow-x-hidden bg-white py-16 sm:py-24">
      <div className="mx-auto w-full min-w-0 max-w-6xl pad-x-page">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <motion.div
            initial={{ opacity: 1, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Reyting tizimi
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Platformada har bir o&apos;quvchi o&apos;z natijalarini reyting orqali
              kuzatadi. Reyting ikki xil bo&apos;ladi:
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-blue-50/80 to-white p-4 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Globe2 className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Respublika bo&apos;yicha umumiy reyting
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Butun mamlakat bo&apos;yicha solishtirish va o&apos;rinda
                    o&apos;zgarishlarni kuzatish.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-teal-50/80 to-white p-4 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  <MapPinned className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    O&apos;quvchining viloyati bo&apos;yicha reyting
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Mahalliy raqobatda o&apos;z o&apos;rnini aniq ko&apos;rish.
                  </p>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 1, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-slate-800">Namuna jadvali</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <ArrowUpRight className="h-3 w-3" aria-hidden />
                Namunaviy
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 sm:px-5">O&apos;rin</th>
                    <th className="px-4 py-3 sm:px-5">Ism</th>
                    <th className="px-4 py-3 sm:px-5">Viloyat</th>
                    <th className="px-4 py-3 sm:px-5">Ball</th>
                    <th className="px-4 py-3 sm:px-5">O&apos;sish</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingRows.map((row, i) => (
                    <tr
                      key={row.rank}
                      className={`border-b border-slate-50 transition-colors hover:bg-slate-50/80 ${
                        i === 0 ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 sm:px-5">
                        {row.rank}
                      </td>
                      <td className="px-4 py-3 text-slate-800 sm:px-5">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600 sm:px-5">{row.region}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 sm:px-5">
                        {row.score}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <span
                          className={
                            row.change.startsWith("+")
                              ? "font-medium text-emerald-600"
                              : "text-slate-400"
                          }
                        >
                          {row.change}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
