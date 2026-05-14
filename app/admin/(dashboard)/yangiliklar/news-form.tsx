"use client";

import { useActionState } from "react";
import type { News } from "@prisma/client";
import { createNews, updateNews, type ActionState } from "./actions";

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4";
const labelClass = "block text-sm font-medium text-slate-700";

export function NewsFormCreate() {
  const [state, action, pending] = useActionState(createNews, undefined as ActionState);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <NewsFields state={state} pending={pending} defaultPublished={false} />
    </form>
  );
}

export function NewsFormEdit({ news }: { news: News }) {
  const bound = updateNews.bind(null, news.id);
  const [state, action, pending] = useActionState(bound, undefined as ActionState);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <NewsFields
        state={state}
        pending={pending}
        defaultTitle={news.title}
        defaultExcerpt={news.excerpt}
        defaultBody={news.body}
        defaultPublished={news.published}
      />
    </form>
  );
}

function NewsFields({
  state,
  pending,
  defaultTitle = "",
  defaultExcerpt = "",
  defaultBody = "",
  defaultPublished,
}: {
  state: ActionState;
  pending: boolean;
  defaultTitle?: string;
  defaultExcerpt?: string;
  defaultBody?: string;
  defaultPublished: boolean;
}) {
  return (
    <>
      <div>
        <label htmlFor="title" className={labelClass}>
          Sarlavha
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultTitle}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="excerpt" className={labelClass}>
          Qisqacha (ihtiyoriy)
        </label>
        <input
          id="excerpt"
          name="excerpt"
          defaultValue={defaultExcerpt}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="body" className={labelClass}>
          Matn
        </label>
        <textarea
          id="body"
          name="body"
          rows={10}
          defaultValue={defaultBody}
          className={`${fieldClass} resize-y min-h-[180px]`}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="published"
          defaultChecked={defaultPublished}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Nashr etish (saytda ko&apos;rinsin)
      </label>
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-2.5 text-sm font-bold text-white shadow-md shadow-[#2563EB]/20 hover:brightness-105 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </button>
    </>
  );
}
