"use client";

import { useState } from "react";
import type { Copy } from "@/lib/i18n";

type SpeciesChoice = {
  uuid: string;
  id: string;
  scientific_name: string;
  common_name?: string | null;
};

export function SpeciesSelect({
  t,
  species,
  defaultValue = "",
  compact = false,
}: {
  t: Copy;
  species: SpeciesChoice[];
  defaultValue?: string;
  compact?: boolean;
}) {
  const [choice, setChoice] = useState(defaultValue);
  const fieldClass = compact
    ? "mt-1 w-full rounded border px-2 py-1"
    : "mt-1 w-full rounded-lg border px-3 py-2";

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        {t.identifiedSpecies}
        <select
          className={fieldClass}
          name="species_id"
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
        >
          <option value="">{t.notIdentified}</option>
          <option value="new">{t.newSpecies}</option>
          {species.map((item) => (
            <option key={item.uuid} value={item.uuid}>
              {item.id} · {item.scientific_name}
              {item.common_name ? ` (${item.common_name})` : ""}
            </option>
          ))}
        </select>
      </label>
      {choice === "new" && (
        <label className="block text-sm">
          {t.newSpeciesName}
          <input className={fieldClass} name="new_species_name" required maxLength={120} />
          <span className="mt-1 block text-neutral-500">{t.newSpeciesHint}</span>
        </label>
      )}
    </div>
  );
}
