"use client";

import Link from "next/link";
import {
  BarChart3,
  LineChart,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";

const cardMotion = {
  initial: { opacity: 1, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-indigo-50/40 pb-20 pt-10 sm:pt-14 lg:pb-28"
    >
      <div
        className="pointer-events-none absolute -right-24 top-20 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid w-full min-w-0 max-w-6xl gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
        <div>
          <motion.div
            initial={{ opacity: 1, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            Onlayn testlar va mock imtihonlar
          </motion.div>
          <motion.h1
            initial={{ opacity: 1, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
          >
            Prezident maktabiga tayyorgarlik uchun zamonaviy test platformasi
          </motion.h1>
          <motion.p
            initial={{ opacity: 1, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            Farzandingiz matematika, mantiqiy fikrlash va ingliz tili bo&apos;yicha
            bilimini sinab boradi, natijalarini kuzatadi va reytingdagi
            o&apos;rnini ko&apos;radi.
          </motion.p>
          <motion.div
            initial={{ opacity: 1, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="#boshlash"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.98]"
            >
              Testlarni boshlash
            </Link>
            <Link
              href="#afzalliklar"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
            >
              Platforma haqida
            </Link>
          </motion.div>
        </div>

        <div className="pointer-events-none relative mx-auto w-full max-w-md lg:max-w-none">
          <motion.div
            initial={{ opacity: 1, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white via-slate-50 to-blue-50/80 p-6 shadow-2xl shadow-slate-300/50 ring-1 ring-slate-200/60"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
            <div className="relative flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-500 shadow-sm">
                  Ta&apos;lim paneli
                </span>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2 flex flex-col justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 p-4 ring-1 ring-blue-200/50">
                  <BarChart3 className="mb-2 h-8 w-8 text-blue-600" />
                  <p className="text-xs font-semibold text-slate-700">
                    O&apos;quv jarayoni
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    Mock testlar, haftalik topshiriqlar va tahlil bir joyda.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...cardMotion}
            transition={{ duration: 0.45, delay: 0.35 }}
            className="absolute -left-2 top-[8%] w-[min(100%,220px)] rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-200/80 sm:left-0 lg:-left-6"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Trophy className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Reyting
                </p>
                <p className="text-sm font-bold text-slate-900">42-o&apos;rin</p>
                <p className="text-xs text-emerald-600">+5 haftada</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...cardMotion}
            transition={{ duration: 0.45, delay: 0.45 }}
            className="absolute -right-2 top-[38%] w-[min(100%,200px)] rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-200/80 sm:right-0 lg:-right-4"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <LineChart className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Taraqqiyot
                </p>
                <p className="text-sm font-bold text-slate-900">78%</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-blue-500 to-teal-400" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...cardMotion}
            transition={{ duration: 0.45, delay: 0.55 }}
            className="absolute -bottom-2 left-1/2 w-[min(100%,240px)] -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-200/80 sm:bottom-0 lg:bottom-4"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Ota-ona
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  Monitoring yoqilgan
                </p>
                <p className="text-[11px] text-slate-500">Oxirgi test: bugun</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
