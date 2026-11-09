export type PlantVisibility = "ordinary" | "rare";

export function plantVisibility(value: unknown): PlantVisibility {
  return value === "rare" ? "rare" : "ordinary";
}

export function visibilitySaveError(message: string) {
  if (/visibility/i.test(message) && /column|schema cache|could not find/i.test(message)) {
    return "Ask an administrator to run apps/mobile/supabase/rare-plants.sql in the Supabase SQL editor, then save again.";
  }
  return message;
}
