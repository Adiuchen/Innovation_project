"use client";

import { useState } from "react";
import Link from "next/link";

export type ApprovedPlantRow = {
  id: string;
  name: string;
  place: string;
  recordedBy: string;
  recordedAt: string;
  search: string;
};

export function ApprovedPlantList({
  rows,
  basePath,
  label,
  placeholder,
  emptyLabel,
  noMatchesLabel,
  columns,
  options,
}: {
  rows: ApprovedPlantRow[];
  basePath: string;
  label: string;
  placeholder: string;
  emptyLabel: string;
  noMatchesLabel: string;
  columns: { name: string; place: string; recordedBy: string };
  options: { value: string; label: string }[];
}) {
  const [text, setText] = useState("");
  const [sort, setSort] = useState("newest");
  const term = text.trim().toLowerCase();
  const visible = rows
    .filter((row) => !term || row.search.includes(term))
    .sort((a, b) => {
      if (sort === "oldest") return a.recordedAt.localeCompare(b.recordedAt);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "place") return a.place.localeCompare(b.place);
      return b.recordedAt.localeCompare(a.recordedAt);
    });

  return (
    <>
      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          {label}
          <select
            className="rounded border px-2 py-1 text-sm"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
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
                <th className="p-3 font-medium">{columns.recordedBy}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link className="font-medium hover:underline" href={`${basePath}/${row.id}`}>
                      {row.id} · {row.name}
                    </Link>
                  </td>
                  <td className="p-3">{row.place || "—"}</td>
                  <td className="p-3">{row.recordedBy || "—"}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td className="p-3 text-neutral-500" colSpan={3}>
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
