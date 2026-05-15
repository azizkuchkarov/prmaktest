"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion, runCelebration } from "@/lib/confetti-burst";

type Props = {
  isRetake: boolean;
};

/**
 * Professional celebration fon: confetti ketma-ket portlashlar, nur yaltiroqi, flash.
 */
export function TestCompletionCelebration({ isRetake }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ranRef = useRef(false);

  useLayoutEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    runCelebration(canvas, { tier: isRetake ? "practice" : "grand" });
  }, [isRetake]);

  const reduce = typeof document !== "undefined" && prefersReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden [perspective:1200px]"
      aria-hidden
    >
      {/* qisqa professional “kamera” flash */}
      {!reduce ? (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/40 to-transparent"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}

      {/* sekin aylanuvchi katak nur (premium podium effekti) */}
      {!reduce ? (
        <motion.div
          className="absolute left-1/2 top-[min(22vh,200px)] h-[min(140vw,900px)] w-[min(140vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform [transform:translateZ(0)]"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(253,224,71,0.12) 18deg, transparent 48deg, transparent 100deg, rgba(167,139,250,0.1) 128deg, transparent 168deg, transparent 220deg, rgba(45,212,191,0.1) 248deg, transparent 290deg, transparent 360deg)",
          }}
          initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 360 }}
          transition={{
            opacity: { duration: 0.6 },
            scale: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
            rotate: { duration: 42, repeat: Infinity, ease: "linear" },
          }}
        />
      ) : null}

      <div
        className="absolute inset-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 92%)",
        }}
      >
        {!reduce ? (
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" width={100} height={100} />
        ) : null}
      </div>

      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-5%,rgba(251,191,36,0.22),transparent_58%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_105%,rgba(99,102,241,0.14),transparent_52%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.75, delay: 0.05 }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.12),transparent_38%)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.08, ease: [0.34, 1.2, 0.64, 1] }}
      />
    </div>
  );
}
