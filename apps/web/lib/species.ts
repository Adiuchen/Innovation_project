import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const NEW_SPECIES_VALUE = "new";

type SpeciesRow = { uuid: string; scientific_name: string };

export async function resolveSpeciesId(
  supabase: SupabaseClient,
  userId: string,
  selected: string | null,
  newName: string | null,
) {
  if (selected !== NEW_SPECIES_VALUE) return { id: selected, error: null as string | null };

  const name = (newName ?? "").trim();
  if (!name) return { id: null, error: "name" };

  const { data: rows } = await supabase
    .from("species")
    .select("uuid, scientific_name")
    .ilike("scientific_name", name)
    .is("hidden_at", null);
  const match = ((rows ?? []) as SpeciesRow[]).find(
    (row) => row.scientific_name.toLowerCase() === name.toLowerCase(),
  );
  if (match) return { id: match.uuid, error: null };

  const inserted = await insertSpecies(supabase, userId, name);
  if (inserted.id) return inserted;

  const admin = createAdminClient();
  if (!admin) return { id: null, error: inserted.error ?? "Could not add the species." };
  return insertSpecies(admin, userId, name);
}

async function insertSpecies(supabase: SupabaseClient, userId: string, name: string) {
  const { data, error } = await supabase
    .from("species")
    .insert({ scientific_name: name, created_by: userId })
    .select("uuid")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "Could not add the species." };
  return { id: data.uuid as string, error: null };
}
