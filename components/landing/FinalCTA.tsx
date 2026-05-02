"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section
      id="boshlash"
      className="pb-20 pt-4 sm:pb-24 sm:pt-6"
    >
      <motion.div
        initial={{ opacity: 1, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-6xl px-4 sm:px-6"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 px-6 py-14 text-center shadow-2xl shadow-blue-500/25 sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl"
            aria-hidden
          />

          <h2 className="relative text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Farzandingizni Prezident maktabi imtihonlariga tizimli tayyorlang
          </h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-blue-50 sm:text-lg">
            Testlar, reyting, tahlil va ota-ona monitoringi orqali tayyorgarlik
            jarayonini aniq va samarali boshqaring.
          </p>
          <div className="relative mt-10">
            <Link
              href="#hero"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition-all hover:gap-3 hover:bg-blue-50 hover:shadow-xl active:scale-[0.98]"
            >
              Boshlash
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
