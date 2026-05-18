import { Fragment, type ReactNode } from "react";

/** Oddiy kasr: `[[2/3]]`. Aralash: `[[4|4/3]]` → 4 butun, kasr qismi 4/3 (vertikal). */
const FRAC_RE =
  /\[\[\s*(?:([-+]?\d+)\s*\|\s*)?(-?\d+)\s*\/\s*(-?\d+)\s*\]\]/g;

/** Word, Telegram, ba’zi klaviaturalar to‘liq kenglikdagi qavs/slash yuboradi; NFKC ularni ASCII ga yaqinlashtiradi. */
function normalizeFractionSource(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\uFF5C/g, "|")
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, "");
}

function StackedFraction({ num, den }: { num: string; den: string }) {
  const d = Number(den);
  if (!Number.isFinite(d) || d === 0) {
    return (
      <span className="font-semibold tabular-nums">
        {num}/{den}
      </span>
    );
  }
  return (
    <span
      className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.82em] font-bold leading-none tabular-nums"
      style={{ verticalAlign: "middle" }}
    >
      <span className="border-b border-current px-0.5 pb-[0.05em]">{num}</span>
      <span className="px-0.5 pt-[0.15em]">{den}</span>
    </span>
  );
}

/**
 * Savol / variant matni: kasrlar + daraja (superscript).
 * - Kasr: `[[3/4]]`, `[[4|4/3]]`
 * - Daraja: `x^2`, `10^-2`, `a^{n+1}` (figurali qavs — harf yoki ifodalar)
 */
export function RenderFractionText({ text }: { text: string }): ReactNode {
  if (!text) return text;
  const normalized = normalizeFractionSource(text);
  const re = new RegExp(FRAC_RE.source, "g");
  const chunks: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let fr = 0;
  let segId = 0;
  while ((m = re.exec(normalized)) !== null) {
    if (m.index > last) {
      chunks.push(parseCarets(normalized.slice(last, m.index), `s-${segId++}`));
    }
    const whole = m[1];
    const num = m[2];
    const den = m[3];
    if (whole !== undefined && whole !== "") {
      chunks.push(
        <span key={`fr-${fr++}`} className="inline-flex items-baseline gap-0.5">
          <span className="font-bold tabular-nums">{whole}</span>
          <StackedFraction num={num} den={den} />
        </span>,
      );
    } else {
      chunks.push(<StackedFraction key={`fr-${fr++}`} num={num} den={den} />);
    }
    last = m.index + m[0].length;
  }
  if (last < normalized.length) {
    chunks.push(parseCarets(normalized.slice(last), `s-${segId++}`));
  }
  if (chunks.length === 0) return text;
  if (chunks.length === 1) return chunks[0];
  return chunks.map((node, idx) => <Fragment key={idx}>{node}</Fragment>);
}

/** `x^2`, `x^{-2}`, `x^{n+1}` — figurali qavs ichida istalgan qisqa matn */
function parseCarets(segment: string, keyPrefix: string): ReactNode {
  if (!segment) return segment;
  const re = /\^\{([^}]*)\}|\^(-?\d+)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let sk = 0;
  while ((m = re.exec(segment)) !== null) {
    if (m.index > last) {
      parts.push(segment.slice(last, m.index));
    }
    const exp = m[1] !== undefined ? m[1] : (m[2] ?? "");
    parts.push(
      <sup
        key={`${keyPrefix}-sup-${sk++}`}
        className="ml-px align-super text-[0.72em] font-semibold leading-none tracking-tight"
      >
        {exp}
      </sup>,
    );
    last = m.index + m[0].length;
  }
  if (last < segment.length) {
    parts.push(segment.slice(last));
  }
  if (parts.length === 0) return segment;
  if (parts.length === 1) return parts[0];
  return parts.map((node, idx) => <Fragment key={`${keyPrefix}-${idx}`}>{node}</Fragment>);
}
