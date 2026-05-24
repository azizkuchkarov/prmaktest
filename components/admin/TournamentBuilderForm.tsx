"use client";

import { useState, useTransition } from "react";
import type { ExamTargetCohort, Question, Test, Tournament } from "@prisma/client";
import { cohortLabelUz } from "@/lib/exam-program";
import type { QuestionDraft } from "@/lib/test-builder-rules";
import {
  createTournamentWithTest,
  updateTournamentWithTest,
  type TournamentSavePayload,
} from "@/app/admin/(dashboard)/turnirlar/actions";
import {
  AdminQuestionEditor,
  initialQuestionRows,
  questionDraftFromPrisma,
} from "@/components/admin/AdminQuestionEditor";

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4";
const labelClass = "block text-sm font-medium text-slate-700";

function toDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInput(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export function TournamentBuilderCreate() {
  const [rows, setRows] = useState<QuestionDraft[]>(() => initialQuestionRows());
  const [title, setTitle] = useState("");
  const [cohort, setCohort] = useState<ExamTargetCohort>("COHORT_4_PREP");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [priceSum, setPriceSum] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [published, setPublished] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload: TournamentSavePayload = {
      title,
      examTargetCohort: cohort,
      durationMinutes,
      priceSum,
      startDate,
      startTime,
      endDate,
      endTime,
      isPublished: published,
      questions: rows.map((r, i) => ({ ...r, order: i + 1 })),
    };
    start(async () => {
      const res = await createTournamentWithTest(payload);
      if (res?.error) setErr(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <TournamentMetaFields
        title={title}
        onTitle={setTitle}
        cohort={cohort}
        onCohort={setCohort}
        durationMinutes={durationMinutes}
        onDuration={setDurationMinutes}
        priceSum={priceSum}
        onPriceSum={setPriceSum}
        startDate={startDate}
        onStartDate={setStartDate}
        startTime={startTime}
        onStartTime={setStartTime}
        endDate={endDate}
        onEndDate={setEndDate}
        endTime={endTime}
        onEndTime={setEndTime}
        published={published}
        onPublished={setPublished}
      />
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 text-sm text-amber-950">
        <p className="font-semibold">Turnir testi — alohida yuklanadi</p>
        <p className="mt-1 text-xs text-amber-900/90">
          Bu savollar katalogdagi testlardan mustaqil. Faqat shu turnir vaqtida o‘quvchilarga beriladi.
        </p>
      </div>
      <AdminQuestionEditor
        rows={rows}
        onRowsChange={setRows}
        imageErr={imageErr}
        onImageErr={setImageErr}
      />
      {err ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200 whitespace-pre-wrap">
          {err}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-8 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda…" : "Turnirni saqlash"}
      </button>
    </form>
  );
}

export function TournamentBuilderEdit({
  tournament,
  test,
  questions,
}: {
  tournament: Tournament;
  test: Test;
  questions: Question[];
}) {
  const [rows, setRows] = useState<QuestionDraft[]>(() =>
    initialQuestionRows(questions.map(questionDraftFromPrisma)),
  );
  const [title, setTitle] = useState(tournament.title);
  const [cohort, setCohort] = useState(tournament.examTargetCohort);
  const [durationMinutes, setDurationMinutes] = useState(test.durationMinutes);
  const [priceSum, setPriceSum] = useState(test.priceSum);
  const [startDate, setStartDate] = useState(toDateInput(tournament.startsAt));
  const [startTime, setStartTime] = useState(toTimeInput(tournament.startsAt));
  const [endDate, setEndDate] = useState(toDateInput(tournament.endsAt));
  const [endTime, setEndTime] = useState(toTimeInput(tournament.endsAt));
  const [published, setPublished] = useState(tournament.isPublished);
  const [err, setErr] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload: TournamentSavePayload = {
      title,
      examTargetCohort: cohort,
      durationMinutes,
      priceSum,
      startDate,
      startTime,
      endDate,
      endTime,
      isPublished: published,
      questions: rows.map((r, i) => ({ ...r, order: i + 1 })),
    };
    start(async () => {
      const res = await updateTournamentWithTest(tournament.id, payload);
      if (res?.error) setErr(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <TournamentMetaFields
        title={title}
        onTitle={setTitle}
        cohort={cohort}
        onCohort={setCohort}
        durationMinutes={durationMinutes}
        onDuration={setDurationMinutes}
        priceSum={priceSum}
        onPriceSum={setPriceSum}
        startDate={startDate}
        onStartDate={setStartDate}
        startTime={startTime}
        onStartTime={setStartTime}
        endDate={endDate}
        onEndDate={setEndDate}
        endTime={endTime}
        onEndTime={setEndTime}
        published={published}
        onPublished={setPublished}
      />
      <AdminQuestionEditor
        rows={rows}
        onRowsChange={setRows}
        imageErr={imageErr}
        onImageErr={setImageErr}
      />
      {err ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200 whitespace-pre-wrap">
          {err}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-8 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}
      </button>
    </form>
  );
}

function TournamentMetaFields({
  title,
  onTitle,
  cohort,
  onCohort,
  durationMinutes,
  onDuration,
  priceSum,
  onPriceSum,
  startDate,
  onStartDate,
  startTime,
  onStartTime,
  endDate,
  onEndDate,
  endTime,
  onEndTime,
  published,
  onPublished,
}: {
  title: string;
  onTitle: (v: string) => void;
  cohort: ExamTargetCohort;
  onCohort: (v: ExamTargetCohort) => void;
  durationMinutes: number;
  onDuration: (v: number) => void;
  priceSum: number;
  onPriceSum: (v: number) => void;
  startDate: string;
  onStartDate: (v: string) => void;
  startTime: string;
  onStartTime: (v: string) => void;
  endDate: string;
  onEndDate: (v: string) => void;
  endTime: string;
  onEndTime: (v: string) => void;
  published: boolean;
  onPublished: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Turnir ma&apos;lumotlari</h2>
      <div>
        <label className={labelClass}>Turnir nomi</label>
        <input className={fieldClass} value={title} onChange={(e) => onTitle(e.target.value)} required />
      </div>
      <div>
        <label className={labelClass}>Sinf bloki</label>
        <select
          className={fieldClass}
          value={cohort}
          onChange={(e) => onCohort(e.target.value as ExamTargetCohort)}
        >
          <option value="COHORT_4_PREP">{cohortLabelUz("COHORT_4_PREP")}</option>
          <option value="COHORT_6_CYCLE">{cohortLabelUz("COHORT_6_CYCLE")}</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Test vaqti (daqiqa)</label>
        <input
          className={fieldClass}
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => onDuration(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <label className={labelClass}>Turnir narxi (so&apos;m)</label>
        <input
          className={fieldClass}
          type="number"
          min={0}
          step={1}
          value={Number.isFinite(priceSum) ? priceSum : 0}
          onChange={(e) => onPriceSum(Math.max(0, Math.round(Number(e.target.value))))}
          placeholder="0 = bepul"
        />
        <p className="mt-1 text-xs text-slate-500">
          Qatnashish boshlanganda o&apos;quvchi balansidan yechiladi. 0 — bepul turnir.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Boshlanish sanasi</label>
          <input className={fieldClass} type="date" value={startDate} onChange={(e) => onStartDate(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Boshlanish vaqti</label>
          <input className={fieldClass} type="time" value={startTime} onChange={(e) => onStartTime(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Tugash sanasi</label>
          <input className={fieldClass} type="date" value={endDate} onChange={(e) => onEndDate(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Tugash vaqti</label>
          <input className={fieldClass} type="time" value={endTime} onChange={(e) => onEndTime(e.target.value)} required />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => onPublished(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Nashr etish (o‘quvchilar ko‘radi)
      </label>
    </div>
  );
}
