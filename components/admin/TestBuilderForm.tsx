"use client";

import { useState, useTransition, useEffect } from "react";
import type {
  Question,
  Test,
  TestCatalogCategory,
  ExamSchoolProgram,
  ExamTargetCohort,
  SpecializedSixTrack,
} from "@prisma/client";
import {
  DEFAULT_NEW_QUESTION_ROWS,
  MAX_QUESTIONS,
  type QuestionDraft,
} from "@/lib/test-builder-rules";
import { createTestFull, updateTestFull, type TestSavePayload } from "@/app/admin/(dashboard)/testlar/actions";
import {
  EXAM_PROGRAM_LABELS,
  examSchoolProgramLabelShort,
  examSummaryAdminUz,
} from "@/lib/exam-program";
import { normalizeBulkPastedText, parseCompactBulkTest } from "@/lib/bulk-test-parser";
import { CATALOG_LABEL_ADMIN, TEST_CATALOG_ORDER } from "@/lib/test-catalog";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Wand2, FileDown, ImagePlus, Loader2 } from "lucide-react";

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

function fromPrisma(q: Question): QuestionDraft {
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

const field =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";
const label = "block text-xs font-medium text-slate-600";

function canProceedExamContext(params: {
  examSchoolProgram: ExamSchoolProgram;
  examTargetCohort: ExamTargetCohort;
  specializedSixTrack: SpecializedSixTrack;
}): boolean {
  if (
    params.examSchoolProgram === "SPECIALIZED_SCHOOL" &&
    params.examTargetCohort === "COHORT_6_CYCLE"
  ) {
    return (
      params.specializedSixTrack === "EXACT_SCIENCES" ||
      params.specializedSixTrack === "NATURAL_SCIENCES"
    );
  }
  return true;
}

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
  const [catalogCategory, setCatalogCategory] = useState<TestCatalogCategory>(
    props.mode === "edit" ? props.test.catalogCategory : "MATHEMATICS",
  );
  const [examSchoolProgram, setExamSchoolProgram] = useState<ExamSchoolProgram>(
    props.mode === "edit" ? props.test.examSchoolProgram : "PRESIDENT_SCHOOL",
  );
  const [examTargetCohort, setExamTargetCohort] = useState<ExamTargetCohort>(
    props.mode === "edit" ? props.test.examTargetCohort : "COHORT_4_PREP",
  );
  const [specializedSixTrack, setSpecializedSixTrack] = useState<SpecializedSixTrack>(
    props.mode === "edit" ? props.test.specializedSixTrack : "NONE",
  );
  const [stage] = useState(props.mode === "edit" ? props.test.stage : "saralash");
  /** Yangi test: avval maktab / sinf konteksti, keyin boshqa maydonlar */
  const [programContextConfirmed, setProgramContextConfirmed] = useState(
    props.mode === "edit",
  );

  useEffect(() => {
    if (examSchoolProgram === "AL_XORAZMIY") {
      setExamTargetCohort("COHORT_4_PREP");
      setSpecializedSixTrack("NONE");
    }
  }, [examSchoolProgram]);

  useEffect(() => {
    if (examSchoolProgram === "PRESIDENT_SCHOOL") {
      setSpecializedSixTrack("NONE");
    }
    if (examSchoolProgram === "SPECIALIZED_SCHOOL" && examTargetCohort === "COHORT_4_PREP") {
      setSpecializedSixTrack("NONE");
    }
  }, [examSchoolProgram, examTargetCohort]);
  const [err, setErr] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [imageUploadKey, setImageUploadKey] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);

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
      setImageErr(data.error ?? "Yuklash muvaffaqiyatsiz.");
      return null;
    }
    return data.url ?? null;
  }

  async function uploadQuestionImage(file: File, rowIndex: number) {
    setImageErr(null);
    setImageUploadKey(`${rowIndex}-q`);
    try {
      const url = await postQuestionImage(file);
      if (url) updateRow(rowIndex, { imageUrl: url });
    } catch {
      setImageErr("Tarmoq xatosi. Qayta urinib ko‘ring.");
    } finally {
      setImageUploadKey(null);
    }
  }

  async function uploadOptionImage(file: File, rowIndex: number, letter: OptionLetter) {
    setImageErr(null);
    setImageUploadKey(`${rowIndex}-${letter}`);
    try {
      const url = await postQuestionImage(file);
      if (url) updateRow(rowIndex, { [OPTION_IMAGE_KEY[letter]]: url } as Partial<QuestionDraft>);
    } catch {
      setImageErr("Tarmoq xatosi. Qayta urinib ko‘ring.");
    } finally {
      setImageUploadKey(null);
    }
  }

  function applySaralashTemplate() {
    setTitle("1-bosqich (saralash) — Matematika");
    setSubject("Matematika");
    setCatalogCategory("MATHEMATICS");
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
    const normalized = normalizeBulkPastedText(bulkText);
    const { questions, errors } = parseCompactBulkTest(normalized);
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
    setBulkText(normalized.trim());
    setBulkMsg(`${questions.length} ta savol jadvalga yuklandi. Quyida tekshirib, saqlang.`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (props.mode === "create" && !programContextConfirmed) {
      setErr("Avval yangi test turini tanlang va «Davom etish» bosing.");
      return;
    }
    const payload: TestSavePayload = {
      title,
      subject,
      description,
      durationMinutes,
      priceSum,
      catalogCategory,
      examSchoolProgram,
      examTargetCohort,
      specializedSixTrack,
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

  const showProgramStep = props.mode === "create" && !programContextConfirmed;
  const proceedOk = canProceedExamContext({
    examSchoolProgram,
    examTargetCohort,
    specializedSixTrack,
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {showProgramStep ? (
        <div className="space-y-6 rounded-2xl border-2 border-violet-200/80 bg-gradient-to-b from-violet-50/90 to-white p-6 shadow-md ring-1 ring-violet-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">1-qadam: qaysi testni qoʻyasiz?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Avval maktab dasturi, sinf bloki va (kerak boʻlsa) ixtisos yoʻnalishini belgilang. Keyingi bosqichda
              nom, fan, katalog boʻlimi, vaqt hamda savollar ochiladi.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              ["PRESIDENT_SCHOOL", "SPECIALIZED_SCHOOL", "AL_XORAZMIY"] as const satisfies readonly ExamSchoolProgram[]
            ).map((p) => {
              const Lab = EXAM_PROGRAM_LABELS[p];
              const active = examSchoolProgram === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setExamSchoolProgram(p)}
                  className={cn(
                    "rounded-xl border-2 px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                    active
                      ? "border-violet-600 bg-white shadow-md shadow-violet-500/15 ring-1 ring-violet-200"
                      : "border-slate-200/90 bg-white/70 hover:border-violet-300/80 hover:bg-white",
                  )}
                >
                  <span className="text-sm font-bold text-slate-900">{Lab.title}</span>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{Lab.subtitle}</p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                    {examSchoolProgramLabelShort(p)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 border-t border-violet-200/60 pt-6">
            <div className="sm:col-span-2">
              <label className={label}>Maktab dasturi</label>
              <select
                className={field}
                value={examSchoolProgram}
                onChange={(e) => setExamSchoolProgram(e.target.value as ExamSchoolProgram)}
                aria-label="Maktab dasturi"
              >
                <option value="PRESIDENT_SCHOOL">Prezident maktablari</option>
                <option value="SPECIALIZED_SCHOOL">Ixtisoslashtirilgan maktablar</option>
                <option value="AL_XORAZMIY">Al-Xorazmiy maktabi</option>
              </select>
            </div>
            <div>
              <label className={label}>Sinf bloki</label>
              <select
                className={field}
                value={examTargetCohort}
                onChange={(e) => setExamTargetCohort(e.target.value as ExamTargetCohort)}
                disabled={examSchoolProgram === "AL_XORAZMIY"}
                aria-label="Sinf bloki"
              >
                <option value="COHORT_4_PREP">4-sinf bloki · 3–4 sinf uchun</option>
                <option value="COHORT_6_CYCLE">6-sinf bloki · 5–9 sinf uchun</option>
              </select>
            </div>
            <div>
              <label className={label}>6-sinf: fan yoʻnalishi (ixtisos maktab)</label>
              <select
                className={field}
                value={specializedSixTrack}
                onChange={(e) => setSpecializedSixTrack(e.target.value as SpecializedSixTrack)}
                disabled={
                  examSchoolProgram !== "SPECIALIZED_SCHOOL" ||
                  examTargetCohort !== "COHORT_6_CYCLE"
                }
                aria-label="Ixtisos maktab yoʻnalishi"
              >
                <option value="NONE">— tanlang (6-sinf ixtisos uchun majburiy)</option>
                <option value="EXACT_SCIENCES">Aniq fanlar</option>
                <option value="NATURAL_SCIENCES">Tabiiy fanlar</option>
              </select>
              {examSchoolProgram === "SPECIALIZED_SCHOOL" && examTargetCohort === "COHORT_6_CYCLE" ? (
                <p className="mt-1 text-[11px] text-violet-800">
                  «6-sinf bloki» tanlangan boʻlsa, yoʻnalishni tanlash shart.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!proceedOk}
              onClick={() => setProgramContextConfirmed(true)}
              className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#2563EB]/25 hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
            >
              Davom etish — batafsil va savollar
            </button>
            {!proceedOk ? (
              <p className="text-xs text-red-700">Ixtisos · 6-sinf bloki uchun Aniq yoki Tabiiy fan tanlang.</p>
            ) : (
              <p className="text-xs text-slate-500">
                Tasdiqlangandan keyin test nomi, fan, narxi hamda savol jadvali ochiladi.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {!showProgramStep && props.mode === "create" ? (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 text-sm ring-1 ring-emerald-100">
          <div>
            <p className="font-semibold text-emerald-950">Tanlangan test konteksti</p>
            <p className="mt-1 text-emerald-900/90">{examSummaryAdminUz({ examSchoolProgram, examTargetCohort, specializedSixTrack })}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
            onClick={() => setProgramContextConfirmed(false)}
          >
            Tanlovni oʻzgartirish
          </button>
        </div>
      ) : null}

      {!showProgramStep ? (
        <>
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
            <label className={label}>Katalog bo&apos;limi</label>
            <select
              className={field}
              value={catalogCategory}
              onChange={(e) => setCatalogCategory(e.target.value as TestCatalogCategory)}
              aria-label="Test katalog boʻlimi"
            >
              {TEST_CATALOG_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATALOG_LABEL_ADMIN[c]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              O&apos;quvchi kabinetida maktab/ro&apos;yxat ostidagi fan blokida chiqadi — Prezident, Ixtisos
              hamda Al-Xorazmiy uchun Mock yoki Matematika yoʻnalishlarida test boʻlishi shart emas;
              istagan boʻlimni tanlaysiz (masalan, Ingliz tili va boshqalar).
            </p>
          </div>
          {props.mode === "edit" ? (
            <>
              <div className="sm:col-span-2">
                <label className={label}>Maktab dasturi</label>
                <select
                  className={field}
                  value={examSchoolProgram}
                  onChange={(e) => setExamSchoolProgram(e.target.value as ExamSchoolProgram)}
                  aria-label="Maktab dasturi"
                >
                  <option value="PRESIDENT_SCHOOL">Prezident maktablari</option>
                  <option value="SPECIALIZED_SCHOOL">Ixtisoslashtirilgan maktablar</option>
                  <option value="AL_XORAZMIY">Al-Xorazmiy maktabi</option>
                </select>
              </div>
              <div>
                <label className={label}>Sinf bloki</label>
                <select
                  className={field}
                  value={examTargetCohort}
                  onChange={(e) => setExamTargetCohort(e.target.value as ExamTargetCohort)}
                  disabled={examSchoolProgram === "AL_XORAZMIY"}
                  aria-label="Sinf bloki"
                >
                  <option value="COHORT_4_PREP">4-sinf bloki · 3–4 sinf uchun</option>
                  <option value="COHORT_6_CYCLE">6-sinf bloki · 5–9 sinf uchun</option>
                </select>
              </div>
              <div>
                <label className={label}>6-sinf: fan yoʻnalishi (ixtisos maktab)</label>
                <select
                  className={field}
                  value={specializedSixTrack}
                  onChange={(e) => setSpecializedSixTrack(e.target.value as SpecializedSixTrack)}
                  disabled={
                    examSchoolProgram !== "SPECIALIZED_SCHOOL" ||
                    examTargetCohort !== "COHORT_6_CYCLE"
                  }
                  aria-label="Ixtisos maktab yo'nalishi"
                >
                  <option value="NONE">— tanlanmagan</option>
                  <option value="EXACT_SCIENCES">Aniq fanlar</option>
                  <option value="NATURAL_SCIENCES">Tabiiy fanlar</option>
                </select>
              </div>
            </>
          ) : null}
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
          Nashr etish (katalogda o&apos;quvchilar ko&apos;radi)
        </label>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-sm text-blue-950">
        <p className="font-semibold">1-bosqich (saralash) — talablar</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
          <li>Har bir savolda A, B, C, D va to&apos;g&apos;ri javob tanlovi</li>
          <li>
            Word dan ko&apos;p qatorli savol (kasr, amallar) va variantlarni{" "}
            <strong>&quot;Matndan yuklash&quot;</strong> orqali qabul qilamiz —{" "}
            <code className="rounded bg-white/60 px-1">1.</code> yoki{" "}
            <code className="rounded bg-white/60 px-1">1)</code>,{" "}
            <code className="rounded bg-white/60 px-1">A.</code> /{" "}
            <code className="rounded bg-white/60 px-1">A)</code>
          </li>
          <li>Har bir savol uchun tushuntirish (Wordda: Tushuntirish: yoki # bilan)</li>
          <li>
            <strong>{DEFAULT_NEW_QUESTION_ROWS} ta savol</strong> koʻrinish uchun namuna — barcha maktablar
            uchun toʻliq savollar sonini oʻzingiz aniqlaysiz ({MAX_QUESTIONS} tagacha jadval).
          </li>
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
            Har bir savol <strong>1.</strong> yoki Word ro&apos;yxatidan <strong>1)</strong> bilan
            boshlanishi mumkin. Savol matni bir nechta qatorda bo&apos;lishi mumkin (kasr, formula
            qatori). Variantlar: <code className="rounded bg-white px-1 font-mono shadow-sm">A. 11</code>,{" "}
            <code className="rounded bg-white px-1 font-mono shadow-sm">A) 11</code> yoki tab bilan. Keyin
            to&apos;g&apos;ri javob: <code className="rounded bg-white px-1 font-mono shadow-sm">@A</code>{" "}
            yoki <code className="rounded bg-white px-1 font-mono shadow-sm">*B</code>. Oxirida{" "}
            <code className="rounded bg-white px-1 font-mono shadow-sm">Tushuntirish: …</code> yoki{" "}
            <code className="rounded bg-white px-1 font-mono shadow-sm"># …</code>.
          </p>
          <ul className="list-inside list-disc space-y-1 text-indigo-950/90">
            <li>
              <strong>Matematika:</strong> kasr va amallar uchun{" "}
              <code className="rounded bg-white/90 px-1 font-mono">1/2</code>, Unicode{" "}
              <code className="rounded bg-white/90 px-1 font-mono">½ × ÷ ≤ ≥</code> ishlatishingiz mumkin
              (Word dan nusxa ko&apos;chirganda saqlanadi).
            </li>
            <li>
              <strong>Savol boshlanishi:</strong> har doim <code className="rounded bg-white/90 px-1 font-mono">1.</code>{" "}
              <code className="rounded bg-white/90 px-1 font-mono">2.</code> (nuqta bilan). Tushuntirish ichida yangi
              qatordan <code className="rounded bg-white/90 px-1 font-mono">1)</code> yoki{" "}
              <code className="rounded bg-white/90 px-1 font-mono">2.</code> yozmaslik yaxshi (bloklar chalkashadi); ro&apos;yxat uchun{" "}
              <code className="rounded bg-white/90 px-1 font-mono">- band</code> ishlating.
            </li>
            <li>
              <strong>Maxsus tire/tirnoq</strong> (Word auto-format) yuklashdan oldin &quot;Matnni
              tozalash&quot; tugmasini bosing.
            </li>
          </ul>
          <p className="font-medium text-indigo-900">
            Word dan to&apos;liq tanlab nusxa oling — bo&apos;shliqlar, tire va raqamlar parser tomonidan
            yengillashtiriladi. Matnni joylashtirib, albatta{" "}
            <strong className="text-indigo-950">«Matnni jadvalga qo&apos;llash»</strong> tugmasini bosing
            (avtomatik saqlanmaydi).
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
              onClick={() => setBulkText((prev) => normalizeBulkPastedText(prev))}
              className="rounded-lg border border-indigo-300 bg-indigo-100/50 px-3 py-1.5 text-xs font-semibold text-indigo-950 hover:bg-indigo-100"
            >
              Matnni tozalash (Word)
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
            placeholder={`1. Savol matni (kasr: [[3/4]], aralash: [[4|4/3]])
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
                <p className="mb-1.5 text-[11px] leading-snug text-slate-500">
                  Vertikal kasr: <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">[[3/4]]</code>; aralash kasr
                  (masalan 4 butun 4/3):{' '}
                  <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">[[4|4/3]]</code>. Daraja:{' '}
                  <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">x^2</code>,{' '}
                  <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">{"a^{n+1}"}</code>. Masalan:
                  &quot;Hisoblang [[2/3]] + [[1/6]]&quot;. Agar talabada hamon{' '}
                  <code className="font-mono text-[10px]">[[3/4]]</code> matn ko‘rinib qolsa, serverda loyihani qayta{' '}
                  <code className="font-mono text-[10px]">build</code> qiling (yangi frontend yuklanmagan bo‘lishi mumkin).
                </p>
                <textarea
                  className={`${field} min-h-[72px] resize-y whitespace-pre-wrap font-sans`}
                  value={row.text}
                  onChange={(e) => updateRow(i, { text: e.target.value })}
                  rows={3}
                  spellCheck={false}
                />
              </div>
              <div className="mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3">
                <label className={label}>Savol rasmi (ixtiyoriy)</label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  JPEG, PNG, WebP yoki GIF, 2.5 MB gacha — geometriya, grafika, screenshot.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50">
                    {imageUploadKey === `${i}-q` ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden />
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
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100"
                    >
                      Rasmni olib tashlash
                    </button>
                  ) : null}
                </div>
                {row.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- dynamic admin uploads path
                  <img
                    src={row.imageUrl}
                    alt=""
                    className="mt-3 max-h-64 w-full rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
                  />
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const tk = OPTION_TEXT_KEY[letter];
                  const ik = OPTION_IMAGE_KEY[letter];
                  const textVal = row[tk] as string;
                  const imgVal = row[ik] as string;
                  return (
                    <div key={letter} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 ring-1 ring-slate-100/80">
                      <label className={label}>
                        {letter} variant — matn va/yoki rasm
                      </label>
                      <input
                        className={`${field} mt-1 whitespace-pre-wrap font-sans`}
                        value={textVal}
                        onChange={(e) => updateRow(i, { [tk]: e.target.value } as Partial<QuestionDraft>)}
                        spellCheck={false}
                        placeholder="Matn (rasm bo‘lsa bo‘sh qoldirish mumkin)"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50">
                          {imageUploadKey === `${i}-${letter}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" aria-hidden />
                          ) : (
                            <ImagePlus className="h-3.5 w-3.5 text-blue-600" aria-hidden />
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
                        {imgVal ? (
                          <button
                            type="button"
                            onClick={() => updateRow(i, { [ik]: "" } as Partial<QuestionDraft>)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-800 hover:bg-red-100"
                          >
                            Rasmsiz
                          </button>
                        ) : null}
                      </div>
                      {imgVal ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin uploads
                        <img
                          src={imgVal}
                          alt=""
                          className="mt-2 max-h-40 w-full rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
                        />
                      ) : null}
                    </div>
                  );
                })}
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
                  className={`${field} min-h-[88px] resize-y whitespace-pre-wrap font-sans`}
                  value={row.solution}
                  onChange={(e) => updateRow(i, { solution: e.target.value })}
                  rows={3}
                  spellCheck={false}
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
      {imageErr ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {imageErr}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-3 text-sm font-bold text-white shadow-md shadow-[#2563EB]/20 hover:brightness-105 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Saqlanmoqda…" : props.mode === "create" ? "Testni yaratish" : "O\u2019zgarishlarni saqlash"}
      </button>
        </>
      ) : null}
    </form>
  );
}
