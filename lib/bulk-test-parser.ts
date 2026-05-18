import type { QuestionDraft } from "@/lib/test-builder-rules";

/**
 * Word / editor dan kiritilgan matn:
 *
 * 1. yoki 1) Savol matni (bir yoki bir nechta qator)
 * A. 11
 * …
 *
 * - Savol `1.` `2.` yoki `1)` `2)` bilan boshlanishi mumkin (Word ro‘yxati)
 * - Variantlar: `A.` / `A)` / tab bilan
 * - To'g'ri javob: `@A` yoki `*B`
 * - Tushuntirish: `#` yoki `Tushuntirish:`
 */

const CORRECT_LINE = /^\s*[*@]\s*([ABCD])\s*$/i;
/** Word: 1. 1) 1: (to'liq belgi va raqamlar) */
const QUESTION_HEAD = /^\s*(\d+)\s*[.):：]\s*(.*)$/;
const TUSHUNTIRISH_HEAD = /^tushuntirish\s*:\s*(.*)$/i;

/** Word / Google Docs: maxsus bo'shliq, tire, tirnoq, to'liq kenglik belgilari */
export function normalizeBulkPastedText(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "");
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/\u2028|\u2029/g, "\n");
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  s = s.replace(/[\u00A0\u202F\u2007\u3000]/g, " ");
  s = s.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  s = s.replace(/\uFF0E/g, ".").replace(/\uFF09/g, ")").replace(/\uFF08/g, "(");
  s = s.replace(/[\u2212\u2013\u2014\u2015]/g, "-");
  s = s.replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'");
  s = s.replace(/[\u201C\u201D\u2033\u00AB\u00BB]/g, '"');
  s = s.replace(/\u2026/g, "...");
  s = s.replace(/[\u00AD\u034F]/g, "");
  s = s.replace(/[^\S\n]+/g, " ");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

function skipBlankLines(lines: string[], start: number): number {
  let i = start;
  while (i < lines.length && lines[i].trim() === "") i += 1;
  return i;
}

function parseInlineOptions(line: string): Pick<QuestionDraft, "optionA" | "optionB" | "optionC" | "optionD"> | null {
  const s = line.trim();
  const re = /([ABCD])[\.\):\-–]?\s*([\s\S]+?)(?=\s+[ABCD][\.\):\-–]?\s+|$)/gi;
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
  const row = /^([ABCD])(?:[\.\):\-–]\s*|\s+|\t+)(.+)$/i;
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

/** Alohida qatorda A. B. C. D. — Word ba'zan tab yoki tire ishlatadi */
const STACK_OPTION_LINE = /^[ABCD](?:[\.\):\-–]\s*|\s+|\t+).+/i;

function parseOneBlock(rawBlock: string, blockIndex: number): { q?: QuestionDraft; error?: string } {
  const block = rawBlock.trim();
  if (!block) return { error: `Blok ${blockIndex}: bo'sh.` };

  const lines = block.split("\n").map((l) => l.replace(/\s+$/, ""));
  const head = lines[0].match(QUESTION_HEAD);
  if (!head) {
    return {
      error: `Blok ${blockIndex}: birinchi qator savol raqami bilan boshlanishi kerak (masalan: 1. yoki 1) Matn).`,
    };
  }

  const stemLines: string[] = [];
  if (head[2].trim()) stemLines.push(head[2].trim());

  let i = 1;
  while (i < lines.length) {
    const raw = lines[i];
    const ln = raw.trim();
    if (ln === "") {
      i += 1;
      continue;
    }
    if (CORRECT_LINE.test(ln) || ln.startsWith("#") || TUSHUNTIRISH_HEAD.test(ln)) break;
    if (/\b[ABCD][\.\):\-–]?\s+.+\b[ABCD][\.\):\-–]?\s+/i.test(ln)) break;
    if (STACK_OPTION_LINE.test(ln)) break;
    stemLines.push(ln);
    i += 1;
  }

  const text = stemLines.join("\n").trim();
  if (!text) return { error: `Blok ${blockIndex}: savol matni bo'sh.` };

  i = skipBlankLines(lines, i);
  if (i >= lines.length) {
    return { error: `Blok ${blockIndex}: A–D variantlari topilmadi.` };
  }

  let options: Pick<QuestionDraft, "optionA" | "optionB" | "optionC" | "optionD"> | null = null;
  const optLine = lines[i].trim();

  if (/\b[ABCD][\.\):\-–]?\s+.+\b[ABCD][\.\):\-–]?\s+/i.test(optLine)) {
    options = parseInlineOptions(optLine);
    i += 1;
  } else {
    const stack: string[] = [];
    let j = i;
    while (j < lines.length && STACK_OPTION_LINE.test(lines[j].trim())) {
      stack.push(lines[j].trim());
      j += 1;
    }
    i = j;
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

  i = skipBlankLines(lines, i);
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

  i = skipBlankLines(lines, i);
  if (i >= lines.length) {
    return {
      error: `Blok ${blockIndex}: tushuntirish # yoki "Tushuntirish:" bilan boshlangan qator kerak.`,
    };
  }

  const solLine = lines[i].trim();
  let solution: string;

  if (solLine.startsWith("#")) {
    const firstSol = solLine.replace(/^#+\s*/, "");
    const restSol = lines.slice(i + 1).map((l) => l.trimEnd());
    solution = [firstSol, ...restSol].join("\n").trim();
  } else {
    const tm = solLine.match(TUSHUNTIRISH_HEAD);
    if (!tm) {
      return {
        error: `Blok ${blockIndex}: yechim "# matn" yoki "Tushuntirish: matn" bilan boshlanishi kerak.`,
      };
    }
    const firstBody = (tm[1] ?? "").trim();
    const restSol = lines.slice(i + 1).map((l) => l.trimEnd());
    solution = [firstBody, ...restSol].join("\n").trim();
  }

  if (!solution) return { error: `Blok ${blockIndex}: tushuntirish matni bo'sh.` };

  return {
    q: {
      order: blockIndex,
      text,
      imageUrl: "",
      ...options,
      optionAImageUrl: "",
      optionBImageUrl: "",
      optionCImageUrl: "",
      optionDImageUrl: "",
      correctAnswer,
      solution,
    },
  };
}

export function parseCompactBulkTest(text: string): { questions: QuestionDraft[]; errors: string[] } {
  const errors: string[] = [];
  const t = normalizeBulkPastedText(text).trim();
  if (!t) return { questions: [], errors: ["Matn bo'sh."] };

  const blocks = t
    .split(/\n(?=\s*\d+\s*[.):：]\s*)/)
    .map((b) => b.trim())
    .filter(Boolean);

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
