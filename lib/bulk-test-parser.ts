import type { QuestionDraft } from "@/lib/test-builder-rules";

/**
 * Ixcham matn formati (bir nechta savol ketma-ket):
 *
 * 1. Savol matni (bir yoki bir nechta qator)
 * A 5 B. 6 C 7 D 8
 * @B
 * # Yechim matni bir yoki bir nechta qator
 *
 * 2. Keyingi savol...
 *
 * Qoidalar:
 * - Har savol `raqam.` bilan boshlanadi (1. 2. 10. …)
 * - Variantlar: bitta qatorda `A … B … C … D …` yoki alohida 4 qator: `A) …` / `A. …`
 * - To'g'ri javob: `@A` yoki `*B` (alohida qator, faqat harf)
 * - Yechim: `#` bilan boshlangan qator(lar) — savol oxirigacha
 */

const CORRECT_LINE = /^\s*[*@]\s*([ABCD])\s*$/i;
const QUESTION_HEAD = /^\s*(\d+)\.\s*(.*)$/;

function parseInlineOptions(line: string): Pick<QuestionDraft, "optionA" | "optionB" | "optionC" | "optionD"> | null {
  const s = line.trim();
  const re = /([ABCD])[\.\):]?\s*([\s\S]+?)(?=\s+[ABCD][\.\):]?\s+|$)/gi;
  const out: Partial<Record<"A" | "B" | "C" | "D", string>> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const L = m[1].toUpperCase() as "A" | "B" | "C" | "D";
    if (L !== "A" && L !== "B" && L !== "C" && L !== "D") continue;
    out[L] = m[2].trim();
  }
  if (!out.A || !out.B || !out.C || !out.D) return null;
  return { optionA: out.A, optionB: out.B, optionC: out.C, optionD: out.D };
}

function parseStackOptions(lines: string[]): Pick<QuestionDraft, "optionA" | "optionB" | "optionC" | "optionD"> | null {
  const row = /^([ABCD])(?:[\.\):]\s*|\s+)(.+)$/i;
  const map: Partial<Record<"A" | "B" | "C" | "D", string>> = {};
  for (const ln of lines) {
    const m = ln.trim().match(row);
    if (!m) return null;
    const L = m[1].toUpperCase() as "A" | "B" | "C" | "D";
    map[L] = m[2].trim();
  }
  if (!map.A || !map.B || !map.C || !map.D) return null;
  return { optionA: map.A, optionB: map.B, optionC: map.C, optionD: map.D };
}

function parseOneBlock(rawBlock: string, blockIndex: number): { q?: QuestionDraft; error?: string } {
  const block = rawBlock.trim();
  if (!block) return { error: `Blok ${blockIndex}: bo'sh.` };

  const lines = block.split("\n").map((l) => l.replace(/\s+$/, ""));
  const head = lines[0].match(QUESTION_HEAD);
  if (!head) {
    return {
      error: `Blok ${blockIndex}: birinchi qator "raqam." bilan boshlanishi kerak (masalan: 1. Savol matni).`,
    };
  }

  const stemLines: string[] = [];
  if (head[2].trim()) stemLines.push(head[2].trim());

  let i = 1;
  while (i < lines.length) {
    const ln = lines[i].trim();
    if (CORRECT_LINE.test(ln) || ln.startsWith("#")) break;
    if (/\b[ABCD][\.\):]?\s+.+\b[ABCD][\.\):]?\s+/i.test(ln)) break;
    if (/^[ABCD][\.\):]?\s+/i.test(ln)) break;
    stemLines.push(ln);
    i += 1;
  }

  const text = stemLines.join("\n").trim();
  if (!text) return { error: `Blok ${blockIndex}: savol matni bo'sh.` };

  if (i >= lines.length) {
    return { error: `Blok ${blockIndex}: A–D variantlari topilmadi.` };
  }

  let options: Pick<QuestionDraft, "optionA" | "optionB" | "optionC" | "optionD"> | null = null;
  const optLine = lines[i].trim();

  if (/\b[ABCD][\.\):]?\s+.+\b[ABCD][\.\):]?\s+/i.test(optLine)) {
    options = parseInlineOptions(optLine);
    i += 1;
  } else {
    const stack: string[] = [];
    while (i < lines.length && /^[ABCD][\.\):]\s+/i.test(lines[i].trim())) {
      stack.push(lines[i].trim());
      i += 1;
    }
    if (stack.length === 4) options = parseStackOptions(stack);
    else if (stack.length === 1) options = parseInlineOptions(stack[0]);
    else {
      return {
        error: `Blok ${blockIndex}: variantlar 4 ta qator (A. … B. …) yoki bitta qatorda A … B … C … D … bo'lishi kerak.`,
      };
    }
  }

  if (!options) {
    return { error: `Blok ${blockIndex}: A, B, C, D variantlari to'liq emas.` };
  }

  if (i >= lines.length) {
    return { error: `Blok ${blockIndex}: to'g'ri javob (@A yoki *B) qatori yo'q.` };
  }

  const corrLine = lines[i].trim();
  const cm = corrLine.match(CORRECT_LINE);
  if (!cm) {
    return {
      error: `Blok ${blockIndex}: to'g'ri javob qatori @A yoki *B ko'rinishida bo'lishi kerak (alohida qator).`,
    };
  }
  const correctAnswer = cm[1].toUpperCase() as QuestionDraft["correctAnswer"];
  i += 1;

  if (i >= lines.length || !lines[i].trim().startsWith("#")) {
    return { error: `Blok ${blockIndex}: yechim # bilan boshlangan qator bilan boshlanishi kerak.` };
  }

  const firstSol = lines[i].trim().replace(/^#+\s*/, "");
  const restSol = lines.slice(i + 1).map((l) => l.trimEnd());
  const solution = [firstSol, ...restSol].join("\n").trim();
  if (!solution) return { error: `Blok ${blockIndex}: yechim matni bo'sh.` };

  return {
    q: {
      order: blockIndex,
      text,
      ...options,
      correctAnswer,
      solution,
    },
  };
}

export function parseCompactBulkTest(text: string): { questions: QuestionDraft[]; errors: string[] } {
  const errors: string[] = [];
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return { questions: [], errors: ["Matn bo'sh."] };

  const blocks = t.split(/\n(?=\s*\d+\.\s+)/).map((b) => b.trim()).filter(Boolean);

  const questions: QuestionDraft[] = [];
  let idx = 1;
  for (const block of blocks) {
    const r = parseOneBlock(block, idx);
    if (r.error) errors.push(r.error);
    else if (r.q) {
      questions.push({ ...r.q, order: idx });
      idx += 1;
    }
  }

  if (questions.length === 0 && errors.length === 0) {
    errors.push("Hech qanday savol topilmadi. Har bir savol 1. 2. … bilan boshlanishi kerak.");
  }

  return { questions, errors };
}
