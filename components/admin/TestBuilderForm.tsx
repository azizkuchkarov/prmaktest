"use client";

import { useState, useTransition } from "react";
import type { Question, Test } from "@prisma/client";
import {
  DEFAULT_NEW_QUESTION_ROWS,
  MAX_QUESTIONS,
  MIN_QUESTIONS_FOR_PUBLISH,
  type QuestionDraft,
} from "@/lib/test-builder-rules";
import { createTestFull, updateTestFull, type TestSavePayload } from "@/app/admin/(dashboard)/testlar/actions";
import { parseCompactBulkTest } from "@/lib/bulk-test-parser";
import { Plus, Trash2, Wand2, FileDown } from "lucide-react";

const BULK_EXAMPLE = `1. 5+ 6 nechchi bo'ladi?
A. 11
B. 12
C. 13
D. 14
@A
Tushuntirish: Demak 5 va 6 ni qo'shsak 11 chiqadi, shuning uchun A varianti to'g'ri.

2. 3 × 3 = ?
A. 6
B. 8
C. 9
D. 12
@C
Tushuntirish: 3×3=9, ya'ni C javobi to'g'ri.`;

function emptyRow(order: number): QuestionDraft {
  return {
    order,
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    solution: "",
  };
}

function fromPrisma(q: Question): QuestionDraft {
  const c = q.correctAnswer;
  const correct: QuestionDraft["correctAnswer"] =
    c === "A" || c === "B" || c === "C" || c === "D" ? c : "A";
  return {
    order: q.order,
    text: q.text,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: correct,
    solution: q.solution,
  };
}

const field =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";
const label = "block text-xs font-medium text-slate-600";

type Props =
  | { mode: "create"; test?: undefined; questions?: undefined }
  | { mode: "edit"; test: Test; questions: Question[] };

export function TestBuilderForm(props: Props) {
  const [rows, setRows] = useState<QuestionDraft[]>(() => {
    if (props.mode === "create") {
      return Array.from({ length: DEFAULT_NEW_QUESTION_ROWS }, (_, i) => emptyRow(i + 1));
    }
    if (props.questions.length === 0) {
      return Array.from({ length: DEFAULT_NEW_QUESTION_ROWS }, (_, i) => emptyRow(i + 1));
    }
    return props.questions.map(fromPrisma);
  });

  const [title, setTitle] = useState(props.mode === "edit" ? props.test.title : "");
  const [subject, setSubject] = useState(props.mode === "edit" ? props.test.subject : "");
  const [description, setDescription] = useState(
    props.mode === "edit" ? props.test.description : "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    props.mode === "edit" ? props.test.durationMinutes : 90,
  );
  const [priceSum, setPriceSum] = useState(
    props.mode === "edit" ? props.test.priceSum : 0,
  );
  const [isPublished, setIsPublished] = useState(
    props.mode === "edit" ? props.test.isPublished : false,
  );
  const [stage] = useState(props.mode === "edit" ? props.test.stage : "saralash");
  const [err, setErr] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function applySaralashTemplate() {
    setTitle("1-bosqich (saralash) — Matematika");
    setSubject("Matematika");
    setDescription(
      "Matematika bo'yicha saralash testi. Taxminan 30 ta test savoli, ~90 daqiqa vaqt.",
    );
    setDurationMinutes(90);
    if (rows.length < DEFAULT_NEW_QUESTION_ROWS) {
      const next = [...rows];
      while (next.length < DEFAULT_NEW_QUESTION_ROWS) {
        next.push(emptyRow(next.length + 1));
      }
      setRows(next.map((r, i) => ({ ...r, order: i + 1 })));
    }
  }

  function updateRow(i: number, patch: Partial<QuestionDraft>) {
    setRows((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, j) => j !== i).map((r, j) => ({ ...r, order: j + 1 })));
  }

  function addRow() {
    setRows((prev) => {
      if (prev.length >= MAX_QUESTIONS) return prev;
      return [...prev, emptyRow(prev.length + 1)];
    });
  }

  function applyBulkFromText() {
    setErr(null);
    setBulkMsg(null);
    const { questions, errors } = parseCompactBulkTest(bulkText);
    if (errors.length > 0) {
      setErr(errors.join("\n"));
      return;
    }
    if (questions.length === 0) {
      setErr("Hech qanday savol topilmadi.");
      return;
    }
    let next = questions.slice(0, MAX_QUESTIONS).map((q, i) => ({ ...q, order: i + 1 }));
    while (next.length < DEFAULT_NEW_QUESTION_ROWS && next.length < MAX_QUESTIONS) {
      next = [...next, emptyRow(next.length + 1)];
    }
    setRows(next);
    setBulkMsg(`${questions.length} ta savol jadvalga yuklandi. Quyida tekshirib, saqlang.`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload: TestSavePayload = {
      title,
      subject,
      description,
      durationMinutes,
      priceSum,
      isPublished,
      stage,
      questions: rows.map((r, i) => ({ ...r, order: i + 1 })),
    };
    start(async () => {
      const res =
        props.mode === "create"
          ? await createTestFull(payload)
          : await updateTestFull(props.test.id, payload);
      if (res?.error) setErr(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Test ma&apos;lumotlari</h2>
            <p className="mt-1 text-xs text-slate-500">
              Bosqich: <span className="font-mono text-slate-700">{stage}</span> (1-bosqich —
              saralash)
            </p>
          </div>
          <button
            type="button"
            onClick={applySaralashTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-900 hover:bg-violet-100"
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden />
            1-bosqich shabloni (Matematika, 90 daq.)
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Test nomi</label>
            <input
              className={field}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={label}>Fan</label>
            <input
              className={field}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Matematika"
              required
            />
          </div>
          <div>
            <label className={label}>Vaqt (daqiqa)</label>
            <input
              className={field}
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Test narxi (so&apos;m)</label>
            <input
              className={field}
              type="number"
              min={0}
              step={1}
              value={Number.isFinite(priceSum) ? priceSum : 0}
              onChange={(e) => setPriceSum(Math.max(0, Math.round(Number(e.target.value))))}
              placeholder="0 = bepul"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Masalan 5000. Nol bo&apos;lsa o&apos;quvchiga bepul / katalogda narx ko&apos;rsatilmaydi.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Tavsif</label>
            <textarea
              className={`${field} min-h-[90px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Nashr etish (kamida {MIN_QUESTIONS_FOR_PUBLISH} ta to&apos;liq savol talab qilinadi)
        </label>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-sm text-blue-950">
        <p className="font-semibold">1-bosqich (saralash) — talablar</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
          <li>Har bir savolda A, B, C, D va to&apos;g&apos;ri javob tanlovi</li>
          <li>Har bir savol uchun tushuntirish (Wordda: Tushuntirish: yoki # bilan)</li>
          <li>
            <strong>30 ta savol</strong> ni Word dan nusxa olib, quyidagi &quot;Matndan yuklash&quot;
            maydoniga joylang
          </li>
          <li>Nashr uchun kamida {MIN_QUESTIONS_FOR_PUBLISH} ta to&apos;liq savol</li>
          <li>Maksimal {MAX_QUESTIONS} ta savol</li>
        </ul>
      </div>

      <details
        open
        className="group rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 to-white p-4 text-sm text-indigo-950 shadow-md shadow-indigo-500/5 open:ring-2 open:ring-indigo-200/50"
      >
        <summary className="cursor-pointer list-none text-base font-bold text-indigo-950 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <FileDown className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
            Word dan bir martada yuklash (30 savol va boshqalar)
          </span>
        </summary>
        <div className="mt-4 space-y-3 border-t border-indigo-200/50 pt-4 text-xs leading-relaxed">
          <p>
            Har bir savol <strong>1.</strong> <strong>2.</strong> kabi raqam bilan boshlanadi. Keyin
            savol matni (bir nechta qator bo&apos;lishi mumkin). Variantlar alohida qatorlarda:{" "}
            <code className="rounded bg-white px-1 font-mono shadow-sm">A. 11</code> …{" "}
            <code className="rounded bg-white px-1 font-mono shadow-sm">D. 14</code>. Keyin to&apos;g&apos;ri
            javob alohida qatorda: <code className="rounded bg-white px-1 font-mono shadow-sm">@A</code>{" "}
            yoki <code className="rounded bg-white px-1 font-mono shadow-sm">*B</code>. Oxirida
            tushuntirish:{" "}
            <code className="rounded bg-white px-1 font-mono shadow-sm">Tushuntirish: ...</code> yoki
            eski usul <code className="rounded bg-white px-1 font-mono shadow-sm"># ...</code>.
          </p>
          <p className="font-medium text-indigo-900">
            Word dan hammasini tanlab nusxa oling — maxsus belgilar va bo&apos;sh qatorlar avtomatik
            tozalanadi.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBulkText(BULK_EXAMPLE)}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
            >
              Namuna matn
            </button>
            <button
              type="button"
              onClick={applyBulkFromText}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Matnni jadvalga qo&apos;llash
            </button>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={18}
            spellCheck={false}
            className="w-full rounded-xl border border-indigo-200 bg-white p-3 font-mono text-[12px] leading-relaxed text-slate-900 shadow-inner outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            placeholder={`1. Savol matni
A. …
B. …
C. …
D. …
@A
Tushuntirish: …

2. Keyingi savol…`}
          />
          {bulkMsg ? (
            <p className="rounded-lg bg-emerald-100/80 px-3 py-2 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200/80">
              {bulkMsg}
            </p>
          ) : null}
        </div>
      </details>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Savollar</h2>
          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= MAX_QUESTIONS}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Savol qo&apos;shish
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {rows.map((row, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
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
                <label className={label}>Savol matni</label>
                <textarea
                  className={`${field} min-h-[72px] resize-y`}
                  value={row.text}
                  onChange={(e) => updateRow(i, { text: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>A variant</label>
                  <input
                    className={field}
                    value={row.optionA}
                    onChange={(e) => updateRow(i, { optionA: e.target.value })}
                  />
                </div>
                <div>
                  <label className={label}>B variant</label>
                  <input
                    className={field}
                    value={row.optionB}
                    onChange={(e) => updateRow(i, { optionB: e.target.value })}
                  />
                </div>
                <div>
                  <label className={label}>C variant</label>
                  <input
                    className={field}
                    value={row.optionC}
                    onChange={(e) => updateRow(i, { optionC: e.target.value })}
                  />
                </div>
                <div>
                  <label className={label}>D variant</label>
                  <input
                    className={field}
                    value={row.optionD}
                    onChange={(e) => updateRow(i, { optionD: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>To&apos;g&apos;ri javob</label>
                  <select
                    className={field}
                    value={row.correctAnswer}
                    onChange={(e) =>
                      updateRow(i, {
                        correctAnswer: e.target.value as QuestionDraft["correctAnswer"],
                      })
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
                <label className={label}>To&apos;g&apos;ri yechim / tushuntirish</label>
                <textarea
                  className={`${field} min-h-[88px] resize-y`}
                  value={row.solution}
                  onChange={(e) => updateRow(i, { solution: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {err ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-3 text-sm font-bold text-white shadow-md shadow-[#2563EB]/20 hover:brightness-105 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Saqlanmoqda…" : props.mode === "create" ? "Testni yaratish" : "O&apos;zgarishlarni saqlash"}
      </button>
    </form>
  );
}
