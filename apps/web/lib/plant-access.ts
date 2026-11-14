export type PlantVisibility = "ordinary" | "rare";

export function plantVisibility(value: unknown): PlantVisibility {
  return value === "rare" ? "rare" : "ordinary";
}

/** Stable tag printed on a label. Uses the saved code, otherwise the same id the public page can still resolve. */
export function plantTagCode(record: { qr_code?: string | null; local_id?: string | null; uuid?: string | null }) {
  if (typeof record.qr_code === "string" && record.qr_code.trim()) return record.qr_code.trim();
  const seed =
    typeof record.local_id === "string" && record.local_id.length >= 8
      ? record.local_id
      : typeof record.uuid === "string"
        ? record.uuid
        : "";
  return seed.length >= 8 ? `plant-${seed.slice(0, 8)}` : null;
}

export function visibilitySaveError(message: string) {
  if (/visibility/i.test(message) && /column|schema cache|could not find/i.test(message)) {
    return "Ask an administrator to run apps/mobile/supabase/rare-plants.sql in the Supabase SQL editor, then save again.";
  }
  return message;
}
