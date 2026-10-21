"use client";

import { useRouter } from "next/navigation";

export function RecordSort({
  sort,
  label,
  options,
}: {
  sort: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <label className="mt-4 flex shrink-0 items-center gap-2 text-sm">
      {label}
      <select
        className="rounded border px-2 py-1 text-sm"
        value={sort}
        onChange={(event) => router.push(`/botanist?sort=${event.target.value}`)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
