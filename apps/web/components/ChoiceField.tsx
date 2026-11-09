"use client";

import { useState } from "react";

export function ChoiceField({
  name,
  label,
  options,
  value,
  otherLabel,
  required = false,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value?: string | null;
  otherLabel: string;
  required?: boolean;
}) {
  const matched = options.find(
    (option) => option.value !== "other" && (option.value === value || option.label.toLowerCase() === (value ?? "").toLowerCase()),
  );
  const [selected, setSelected] = useState(!value ? "" : matched ? matched.value : "other");

  return (
    <div className="block text-sm">
      <label>
        {label}
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          name={name}
          value={selected}
          required={required}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">—</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {selected === "other" && (
        <input
          className="mt-2 w-full rounded-lg border px-3 py-2"
          name={`${name}_note`}
          defaultValue={matched ? "" : value ?? ""}
          placeholder={otherLabel}
          maxLength={80}
          required
        />
      )}
    </div>
  );
}
