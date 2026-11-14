import type { SupabaseClient } from "@supabase/supabase-js";

export function kitPlantId(value: string | null | undefined) {
  const id = value?.trim();
  return id ? id.toUpperCase() : null;
}

export async function loadIotKitPlantId(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("iot_kit").select("plant_id").eq("id", 1).maybeSingle();
  if (error) return { plantId: null as string | null, error: error.message };
  return { plantId: kitPlantId(typeof data?.plant_id === "string" ? data.plant_id : null), error: null as string | null };
}
