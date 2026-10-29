"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { statusTone } from "@/lib/status-tone";

export type FieldRecordRow = {
  uuid: string;
  id: string;
  title: string;
  place: string;
  status: string;
  statusLabel: string;
  review: string;
  attention: boolean;
  search: string;
};

export function RecordSort({
  sort,
  query,
  label,
  placeholder,
  emptyLabel,
  noMatchesLabel,
  columns,
  options,
  rows,
}: {
  sort: string;
  query: string;
  label: string;
  placeholder: string;
  emptyLabel: string;
  noMatchesLabel: string;
  columns: { name: string; place: string; status: string; review: string };
  options: { value: string; label: string }[];
  rows: FieldRecordRow[];
}) {
  const router = useRouter();
  const [text, setText] = useState(query);

  useEffect(() => {
    setText(query);
  }, [query]);
  const term = text.trim().toLowerCase();
  const visible = term ? rows.filter((row) => row.search.includes(term)) : rows;

  function go(nextSort: string, nextQuery: string) {
    const params = new URLSearchParams();
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    const nextTerm = nextQuery.trim();
    if (nextTerm) params.set("q", nextTerm);
    const search = params.toString();
    router.push(search ? `/botanist?${search}` : "/botanist");
  }

  return (
    <>
      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          {label}
          <select
            className="rounded border px-2 py-1 text-sm"
            value={sort}
            onChange={(event) => go(event.target.value, text)}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <input
          className="min-w-48 flex-1 rounded border px-2 py-1 sm:max-w-xs"
          value={text}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div className="mt-4 mb-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-emerald-950/15 bg-white shadow-sm">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-emerald-50 text-left text-forest">
                <th className="p-3 font-medium">{columns.name}</th>
                <th className="p-3 font-medium">{columns.place}</th>
                <th className="p-3 font-medium">{columns.status}</th>
                <th className="p-3 font-medium">{columns.review}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className={`border-b last:border-0 ${row.attention ? "bg-amber-50" : ""}`}>
                  <td className="p-3">
                    <Link className="font-medium hover:underline" href={`/botanist/${row.uuid}`}>{row.title}</Link>
                  </td>
                  <td className="p-3">{row.place}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(row.status)}`}>
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="p-3">{row.review}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td className="p-3 text-neutral-500" colSpan={4}>
                    {term ? noMatchesLabel : emptyLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
