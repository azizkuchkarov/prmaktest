/**
 * Professional celebration — bir nechta portlash, turli shakllar, oltin / rangli confetti.
 * prefers-reduced-motion komponentda o‘chiriladi.
 */

export type CelebrationTier = "grand" | "practice";

export type CelebrationRunOptions = {
  tier?: CelebrationTier;
};

function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

type ShapeKind = 0 | 1 | 2 | 3; // rect, tri, circle, star

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ay: number;
  life: number;
  lifeDec: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  shape: ShapeKind;
  /** oddiy yoki yorug‘lik qatlami */
  blend: "source-over" | "lighter";
  /** rang yoki 'gold' */
  color: string;
  isGold: boolean;
};

function pushBurst(
  list: Particle[],
  ox: number,
  oy: number,
  count: number,
  angleCenter: number,
  spread: number,
  speedMin: number,
  speedMax: number,
  palette: string[],
  grand: boolean,
) {
  for (let i = 0; i < count; i++) {
    const ang = angleCenter + (Math.random() - 0.5) * spread;
    const sp = speedMin + Math.random() * (speedMax - speedMin);
    const gold = grand && Math.random() < 0.18;
    const sparkle = grand && Math.random() < 0.12;
    const shapeRoll = Math.random();
    let shape: ShapeKind = 0;
    if (shapeRoll > 0.72) shape = 1;
    else if (shapeRoll > 0.52) shape = 2;
    else if (grand && shapeRoll > 0.38) shape = 3;

    list.push({
      x: ox + (Math.random() - 0.5) * 28,
      y: oy + (Math.random() - 0.5) * 18,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp * (0.88 + Math.random() * 0.2),
      ay: 0.14 + Math.random() * 0.14,
      life: 1,
      lifeDec: sparkle ? 0.007 + Math.random() * 0.004 : 0.0045 + Math.random() * 0.003,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * (grand ? 0.28 : 0.18),
      w: sparkle ? 2 + Math.random() * 3 : 4 + Math.random() * 7,
      h: sparkle ? 2 + Math.random() * 2 : 2.5 + Math.random() * 5,
      shape: sparkle ? 2 : shape,
      blend: sparkle ? "lighter" : "source-over",
      color: gold
        ? "#fbbf24"
        : palette[Math.floor(Math.random() * palette.length)] ?? "#10b981",
      isGold: gold,
    });
  }
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  const spikes = 5;
  const outer = r;
  const inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (i * Math.PI) / spikes - Math.PI / 2;
    const dist = i % 2 === 0 ? outer : inner;
    const x = Math.cos(rad) * dist;
    const y = Math.sin(rad) * dist;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalCompositeOperation = p.blend;
  ctx.globalAlpha = Math.max(0, Math.min(1, p.life * (p.blend === "lighter" ? 1.4 : 1.05)));

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);

  if (p.isGold && p.shape === 0) {
    const g = ctx.createLinearGradient(-p.w, -p.h, p.w, p.h);
    g.addColorStop(0, "#fef9c3");
    g.addColorStop(0.35, "#fcd34d");
    g.addColorStop(0.65, "#f59e0b");
    g.addColorStop(1, "#b45309");
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = p.color;
  }

  switch (p.shape) {
    case 0: {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      break;
    }
    case 1: {
      ctx.beginPath();
      ctx.moveTo(0, -p.h);
      ctx.lineTo(p.w / 2, p.h / 2);
      ctx.lineTo(-p.w / 2, p.h / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 2: {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(p.w, p.h) * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 3:
      drawStar(ctx, Math.max(p.w, p.h) * 0.6);
      break;
    default:
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  }

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

const GRAND_PALETTE = [
  "#fbbf24",
  "#f59e0b",
  "#eab308",
  "#f472b6",
  "#a78bfa",
  "#818cf8",
  "#38bdf8",
  "#22d3ee",
  "#34d399",
  "#4ade80",
  "#fcd34d",
  "#fb923c",
];

const PRACTICE_PALETTE = ["#2dd4bf", "#14b8a6", "#0d9488", "#5eead4", "#99f6e4", "#34d399", "#6ee7b7"];

/**
 * Bir martalik to‘liq celebration animatsiyasi (bir nechta portlash bir loopda).
 */
export function runCelebration(canvas: HTMLCanvasElement, options: CelebrationRunOptions = {}) {
  const tier = options.tier ?? "grand";
  const grand = tier === "grand";
  const { ctx, w, h } = resizeCanvas(canvas);
  if (!ctx) return;

  const particles: Particle[] = [];
  const palette = grand ? GRAND_PALETTE : PRACTICE_PALETTE;

  const oy = h * 0.2;
  const drag = 0.987;

  // boshlang‘ich portlashlar (kadrlar 0, 8, 18, 32, 48)
  const schedule: { frame: number; fn: () => void }[] = [];

  if (grand) {
    schedule.push(
      {
        frame: 0,
        fn: () =>
          pushBurst(particles, w * 0.5, oy, 210, -Math.PI / 2, Math.PI * 1.35, 9, 24, palette, true),
      },
      {
        frame: 8,
        fn: () => pushBurst(particles, w * 0.12, h * 0.35, 75, -Math.PI / 2.6, Math.PI * 0.55, 11, 22, palette, true),
      },
      {
        frame: 16,
        fn: () =>
          pushBurst(particles, w * 0.88, h * 0.35, 75, -Math.PI * 1.55, Math.PI * 0.55, 11, 22, palette, true),
      },
      {
        frame: 30,
        fn: () =>
          pushBurst(particles, w * 0.5, h * 0.08, 95, -Math.PI / 2, Math.PI * 2.1, 6, 16, palette, true),
      },
      {
        frame: 48,
        fn: () => {
          for (let i = 0; i < 55; i++) {
            pushBurst(
              particles,
              w * (0.15 + Math.random() * 0.7),
              -20,
              1,
              Math.PI / 2 + (Math.random() - 0.5) * 0.4,
              0.5,
              3 + Math.random() * 5,
              7,
              palette,
              true,
            );
          }
        },
      },
    );
  } else {
    schedule.push(
      {
        frame: 0,
        fn: () =>
          pushBurst(particles, w * 0.5, oy, 95, -Math.PI / 2, Math.PI * 1.1, 7, 17, palette, false),
      },
      {
        frame: 14,
        fn: () => pushBurst(particles, w * 0.5, h * 0.12, 55, -Math.PI / 2, Math.PI * 1.4, 5, 12, palette, false),
      },
    );
  }

  let frame = 0;
  const maxFrames = grand ? 260 : 180;

  const tick = () => {
    for (const s of schedule) {
      if (s.frame === frame) s.fn();
    }

    ctx.clearRect(0, 0, w, h);

    let alive = false;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      alive = true;
      p.vy += p.ay;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vr *= 0.992;
      p.life -= p.lifeDec;

      if (p.y > h + 80) p.life = 0;

      drawParticle(ctx, p);
    }

    frame++;
    if ((alive || frame < (grand ? 55 :30)) && frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  };

  requestAnimationFrame(tick);
}

/** Eski API — ichida grand / practice */
export function runConfettiBurst(
  canvas: HTMLCanvasElement,
  options: { intensity?: number; originY?: number } = {},
) {
  const t = (options.intensity ?? 1) < 0.55 ? "practice" : "grand";
  runCelebration(canvas, { tier: t });
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
