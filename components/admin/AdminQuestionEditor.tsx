"use client";

import { useState } from "react";
import { FileDown, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_NEW_QUESTION_ROWS,
  MAX_QUESTIONS,
  type QuestionDraft,
} from "@/lib/test-builder-rules";
import { normalizeBulkPastedText, parseCompactBulkTest } from "@/lib/bulk-test-parser";

type OptionLetter = "A" | "B" | "C" | "D";

const OPTION_IMAGE_KEY: Record<OptionLetter, keyof QuestionDraft> = {
  A: "optionAImageUrl",
  B: "optionBImageUrl",
  C: "optionCImageUrl",
  D: "optionDImageUrl",
};

const OPTION_TEXT_KEY: Record<OptionLetter, keyof QuestionDraft> = {
  A: "optionA",
  B: "optionB",
  C: "optionC",
  D: "optionD",
};

const BULK_EXAMPLE = `1. 5+ 6 nechchi bo'ladi?
A. 11
B. 12
C. 13
D. 14
@A
Tushuntirish: 5 va 6 ni qo'shsak 11.

2. 3 × 3 = ?
A. 6
B. 8
C. 9
D. 12
@C
Tushuntirish: 3×3=9.`;

export const adminFieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";
export const adminLabelClass = "block text-xs font-medium text-slate-600";

export function emptyQuestionRow(order: number): QuestionDraft {
  return {
    order,
    text: "",
    imageUrl: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    optionAImageUrl: "",
    optionBImageUrl: "",
    optionCImageUrl: "",
    optionDImageUrl: "",
    correctAnswer: "A",
    solution: "",
  };
}

export function questionDraftFromPrisma(q: {
  order: number;
  text: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionAImageUrl: string | null;
  optionBImageUrl: string | null;
  optionCImageUrl: string | null;
  optionDImageUrl: string | null;
  correctAnswer: string;
  solution: string;
}): QuestionDraft {
  const c = q.correctAnswer;
  const correct: QuestionDraft["correctAnswer"] =
    c === "A" || c === "B" || c === "C" || c === "D" ? c : "A";
  return {
    order: q.order,
    text: q.text,
    imageUrl: q.imageUrl ?? "",
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    optionAImageUrl: q.optionAImageUrl ?? "",
    optionBImageUrl: q.optionBImageUrl ?? "",
    optionCImageUrl: q.optionCImageUrl ?? "",
    optionDImageUrl: q.optionDImageUrl ?? "",
    correctAnswer: correct,
    solution: q.solution,
  };
}

export function initialQuestionRows(existing?: QuestionDraft[]): QuestionDraft[] {
  if (existing && existing.length > 0) return existing;
  return Array.from({ length: DEFAULT_NEW_QUESTION_ROWS }, (_, i) => emptyQuestionRow(i + 1));
}

type Props = {
  rows: QuestionDraft[];
  onRowsChange: (rows: QuestionDraft[]) => void;
  imageErr: string | null;
  onImageErr: (msg: string | null) => void;
};

export function AdminQuestionEditor({ rows, onRowsChange, imageErr, onImageErr }: Props) {
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [imageUploadKey, setImageUploadKey] = useState<string | null>(null);

  function updateRow(i: number, patch: Partial<QuestionDraft>) {
    const copy = [...rows];
    copy[i] = { ...copy[i], ...patch };
    onRowsChange(copy);
  }

  function removeRow(i: number) {
    onRowsChange(rows.filter((_, j) => j !== i).map((r, j) => ({ ...r, order: j + 1 })));
  }

  function addRow() {
    if (rows.length >= MAX_QUESTIONS) return;
    onRowsChange([...rows, emptyQuestionRow(rows.length + 1)]);
  }

  async function postQuestionImage(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/question-images", {
      method: "POST",
      body: fd,
      credentials: "same-origin",
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) {
      onImageErr(data.error ?? "Yuklash muvaffaqiyatsiz.");
      return null;
    }
    return data.url ?? null;
  }

  async function uploadQuestionImage(file: File, rowIndex: number) {
    onImageErr(null);
    setImageUploadKey(`${rowIndex}-q`);
    try {
      const url = await postQuestionImage(file);
      if (url) updateRow(rowIndex, { imageUrl: url });
    } catch {
      onImageErr("Tarmoq xatosi. Qayta urinib ko‘ring.");
    } finally {
      setImageUploadKey(null);
    }
  }

  async function uploadOptionImage(file: File, rowIndex: number, letter: OptionLetter) {
    onImageErr(null);
    setImageUploadKey(`${rowIndex}-${letter}`);
    try {
      const url = await postQuestionImage(file);
      if (url) updateRow(rowIndex, { [OPTION_IMAGE_KEY[letter]]: url } as Partial<QuestionDraft>);
    } catch {
      onImageErr("Tarmoq xatosi. Qayta urinib ko‘ring.");
    } finally {
      setImageUploadKey(null);
    }
  }

  function applyBulkFromText() {
    setBulkMsg(null);
    const normalized = normalizeBulkPastedText(bulkText);
    const { questions, errors } = parseCompactBulkTest(normalized);
    if (errors.length > 0) {
      onImageErr(errors.join("\n"));
      return;
    }
    if (questions.length === 0) {
      onImageErr("Hech qanday savol topilmadi.");
      return;
    }
    let next = questions.slice(0, MAX_QUESTIONS).map((q, i) => ({ ...q, order: i + 1 }));
    while (next.length < DEFAULT_NEW_QUESTION_ROWS && next.length < MAX_QUESTIONS) {
      next = [...next, emptyQuestionRow(next.length + 1)];
    }
    onRowsChange(next);
    setBulkText(normalized.trim());
    setBulkMsg(`${questions.length} ta savol jadvalga yuklandi.`);
    onImageErr(null);
  }

  return (
    <div className="space-y-4">
      <details className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 open:ring-2 open:ring-indigo-200/50">
        <summary className="cursor-pointer list-none text-sm font-bold text-indigo-950 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <FileDown className="h-4 w-4 text-indigo-600" aria-hidden />
            Word dan bir martada yuklash
          </span>
        </summary>
        <div className="mt-3 space-y-2 border-t border-indigo-200/50 pt-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBulkText(BULK_EXAMPLE)}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
            >
              Namuna
            </button>
            <button
              type="button"
              onClick={() => setBulkText((prev) => normalizeBulkPastedText(prev))}
              className="rounded-lg border border-indigo-300 bg-indigo-100/50 px-3 py-1.5 text-xs font-semibold text-indigo-950"
            >
              Matnni tozalash
            </button>
            <button
              type="button"
              onClick={applyBulkFromText}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Jadvalga qo&apos;llash
            </button>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full rounded-xl border border-indigo-200 bg-white p-3 font-mono text-xs text-slate-900"
            placeholder="1. Savol…&#10;A. …&#10;@A&#10;Tushuntirish: …"
          />
          {bulkMsg ? (
            <p className="rounded-lg bg-emerald-100/80 px-3 py-2 text-xs font-medium text-emerald-900">
              {bulkMsg}
            </p>
          ) : null}
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Turnir savollari</h3>
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= MAX_QUESTIONS}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Savol qo&apos;shish
        </button>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {rows.map((row, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Savol {i + 1}</span>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  O&apos;chirish
                </button>
              ) : null}
            </div>
            <div className="mb-3">
              <label className={adminLabelClass}>Savol matni</label>
              <textarea
                className={`${adminFieldClass} min-h-[72px] resize-y whitespace-pre-wrap`}
                value={row.text}
                onChange={(e) => updateRow(i, { text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3">
              <label className={adminLabelClass}>Savol rasmi (ixtiyoriy)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">
                  {imageUploadKey === `${i}-q` ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-blue-600" aria-hidden />
                  )}
                  Rasm yuklash
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={imageUploadKey !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void uploadQuestionImage(f, i);
                    }}
                  />
                </label>
                {row.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => updateRow(i, { imageUrl: "" })}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
                  >
                    Olib tashlash
                  </button>
                ) : null}
              </div>
              {row.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.imageUrl} alt="" className="mt-3 max-h-48 w-full rounded-lg border object-contain" />
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const tk = OPTION_TEXT_KEY[letter];
                const ik = OPTION_IMAGE_KEY[letter];
                return (
                  <div key={letter} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                    <label className={adminLabelClass}>{letter} variant</label>
                    <input
                      className={adminFieldClass}
                      value={row[tk] as string}
                      onChange={(e) => updateRow(i, { [tk]: e.target.value } as Partial<QuestionDraft>)}
                    />
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold">
                      {imageUploadKey === `${i}-${letter}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Rasm
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        disabled={imageUploadKey !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void uploadOptionImage(f, i, letter);
                        }}
                      />
                    </label>
                    {(row[ik] as string) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row[ik] as string} alt="" className="mt-2 max-h-32 w-full rounded border object-contain" />
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={adminLabelClass}>To&apos;g&apos;ri javob</label>
                <select
                  className={adminFieldClass}
                  value={row.correctAnswer}
                  onChange={(e) =>
                    updateRow(i, { correctAnswer: e.target.value as QuestionDraft["correctAnswer"] })
                  }
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className={adminLabelClass}>Tushuntirish</label>
              <textarea
                className={`${adminFieldClass} min-h-[72px] resize-y whitespace-pre-wrap`}
                value={row.solution}
                onChange={(e) => updateRow(i, { solution: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      {imageErr ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 whitespace-pre-wrap">
          {imageErr}
        </p>
      ) : null}
    </div>
  );
}
