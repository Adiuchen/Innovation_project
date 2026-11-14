import type { SupabaseClient } from "@supabase/supabase-js";
import { choiceFromForm, plantRecordProblems } from "@/lib/field-choices";
import { numberOrNull, textOrNull } from "@/lib/format";
import { plantVisibility, type PlantVisibility } from "@/lib/plant-access";
import { uploadPlantPhoto } from "@/lib/photos";

export type SpeciesChoice = {
  uuid: string;
  id: string;
  scientific_name: string;
  common_name: string | null;
  local_name: string | null;
  family: string | null;
  genus: string | null;
  description: string | null;
  conservation_status: string | null;
  distribution: string | null;
  ecological_info: string | null;
  cultural_significance: string | null;
};

export type UpdatePhoto = {
  id: string;
  storage_path: string;
  caption: string | null;
};

export type PlantDraft = {
  plant_name: string | null;
  life_stage: string | null;
  species_id: string | null;
  new_species_name: string | null;
  height_m: number | null;
  trunk_diameter_cm: number | null;
  leaf_traits: string | null;
  flower_fruit_traits: string | null;
  health_status: string | null;
  other_traits: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: PlantVisibility;
  scientific_name: string | null;
  common_name: string | null;
  local_name: string | null;
  family: string | null;
  genus: string | null;
  description: string | null;
  conservation_status: string | null;
  distribution: string | null;
  ecological_info: string | null;
  cultural_significance: string | null;
  hide_photo_ids: string[];
};

const SPECIES_FIELDS =
  "uuid, id, scientific_name, common_name, local_name, family, genus, description, conservation_status, distribution, ecological_info, cultural_significance";

export function updatesSchemaMissing(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "PGRST204" || error.code === "PGRST205" || /plant_updates|pending_update_id|schema cache/i.test(message);
}

export function updateProblems(formData: FormData) {
  const choice = String(formData.get("species_id") ?? "").trim();
  if (choice === "new") formData.set("new_species_name", textOrNull(formData.get("scientific_name")) ?? "");
  return plantRecordProblems(formData) ?? (textOrNull(formData.get("scientific_name")) ? null : "Enter a scientific name.");
}

export function draftFromUpdateForm(formData: FormData): PlantDraft {
  const choice = String(formData.get("species_id") ?? "").trim();
  const scientific = textOrNull(formData.get("scientific_name"));
  return {
    plant_name: textOrNull(formData.get("plant_name")),
    life_stage: choiceFromForm(formData, "life_stage"),
    species_id: choice && choice !== "new" ? choice : null,
    new_species_name: choice === "new" ? scientific : null,
    height_m: numberOrNull(formData.get("height_m")),
    trunk_diameter_cm: numberOrNull(formData.get("trunk_diameter_cm")),
    leaf_traits: choiceFromForm(formData, "leaf_traits"),
    flower_fruit_traits: choiceFromForm(formData, "flower_fruit_traits"),
    health_status: choiceFromForm(formData, "health_status"),
    other_traits: textOrNull(formData.get("other_traits")),
    location_name: textOrNull(formData.get("location_name")),
    latitude: numberOrNull(formData.get("latitude")),
    longitude: numberOrNull(formData.get("longitude")),
    visibility: plantVisibility(formData.get("visibility")),
    scientific_name: scientific,
    common_name: textOrNull(formData.get("common_name")),
    local_name: textOrNull(formData.get("local_name")),
    family: textOrNull(formData.get("family")),
    genus: textOrNull(formData.get("genus")),
    description: textOrNull(formData.get("description")),
    conservation_status: textOrNull(formData.get("conservation_status")),
    distribution: textOrNull(formData.get("distribution")),
    ecological_info: textOrNull(formData.get("ecological_info")),
    cultural_significance: textOrNull(formData.get("cultural_significance")),
    hide_photo_ids: formData.getAll("hide_photo").map(String).filter(Boolean),
  };
}

export function draftFromRow(row: Partial<PlantDraft> & { hide_photo_ids?: string[] | null }): PlantDraft {
  return {
    plant_name: row.plant_name ?? null,
    life_stage: row.life_stage ?? null,
    species_id: row.species_id ?? null,
    new_species_name: row.new_species_name ?? null,
    height_m: row.height_m ?? null,
    trunk_diameter_cm: row.trunk_diameter_cm ?? null,
    leaf_traits: row.leaf_traits ?? null,
    flower_fruit_traits: row.flower_fruit_traits ?? null,
    health_status: row.health_status ?? null,
    other_traits: row.other_traits ?? null,
    location_name: row.location_name ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    visibility: plantVisibility(row.visibility),
    scientific_name: row.scientific_name ?? row.new_species_name ?? null,
    common_name: row.common_name ?? null,
    local_name: row.local_name ?? null,
    family: row.family ?? null,
    genus: row.genus ?? null,
    description: row.description ?? null,
    conservation_status: row.conservation_status ?? null,
    distribution: row.distribution ?? null,
    ecological_info: row.ecological_info ?? null,
    cultural_significance: row.cultural_significance ?? null,
    hide_photo_ids: row.hide_photo_ids ?? [],
  };
}

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function loadApprovedPlant(supabase: SupabaseClient, plantId: string) {
  const { data, error } = await supabase
    .from("plant_records")
    .select(
      `uuid, id, qr_code, botanist_id, plant_name, life_stage, species_id, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits, location_name, latitude, longitude, visibility, species(${SPECIES_FIELDS}), profiles!plant_records_botanist_id_fkey(name)`,
    )
    .eq("id", plantId)
    .eq("status", "approved")
    .maybeSingle();
  if (error || !data) return null;
  const species = one(data.species as SpeciesChoice | SpeciesChoice[] | null);
  const botanist = one(data.profiles as { name?: string | null } | { name?: string | null }[] | null);
  return {
    uuid: String(data.uuid),
    id: typeof data.id === "string" ? data.id : plantId,
    qrCode: typeof data.qr_code === "string" ? data.qr_code : null,
    botanistId: typeof data.botanist_id === "string" ? data.botanist_id : null,
    botanistName: botanist?.name ?? null,
    draft: draftFromRow({
      plant_name: data.plant_name,
      life_stage: data.life_stage,
      species_id: data.species_id,
      height_m: data.height_m,
      trunk_diameter_cm: data.trunk_diameter_cm,
      leaf_traits: data.leaf_traits,
      flower_fruit_traits: data.flower_fruit_traits,
      health_status: data.health_status,
      other_traits: data.other_traits,
      location_name: data.location_name,
      latitude: data.latitude,
      longitude: data.longitude,
      visibility: data.visibility,
      scientific_name: species?.scientific_name ?? null,
      common_name: species?.common_name ?? null,
      local_name: species?.local_name ?? null,
      family: species?.family ?? null,
      genus: species?.genus ?? null,
      description: species?.description ?? null,
      conservation_status: species?.conservation_status ?? null,
      distribution: species?.distribution ?? null,
      ecological_info: species?.ecological_info ?? null,
      cultural_significance: species?.cultural_significance ?? null,
    }),
    species,
  };
}

export async function listSpeciesChoices(supabase: SupabaseClient, current: SpeciesChoice | null) {
  const { data } = await supabase.from("species").select(SPECIES_FIELDS).is("hidden_at", null).order("scientific_name");
  const rows = (data ?? []) as SpeciesChoice[];
  if (current && !rows.some((row) => row.uuid === current.uuid)) rows.unshift(current);
  return rows;
}

export async function listLivePhotos(supabase: SupabaseClient, recordUuid: string) {
  const { data, error } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption, pending_update_id")
    .eq("plant_record_id", recordUuid)
    .is("hidden_at", null);
  if (error) return [] as UpdatePhoto[];
  return (data ?? []).filter((photo) => !photo.pending_update_id) as UpdatePhoto[];
}

export async function listPendingPhotos(supabase: SupabaseClient, updateId: string) {
  const { data } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("pending_update_id", updateId);
  return (data ?? []) as UpdatePhoto[];
}

function speciesText(draft: PlantDraft) {
  return {
    scientific_name: draft.scientific_name ?? draft.new_species_name ?? "",
    common_name: draft.common_name,
    local_name: draft.local_name,
    family: draft.family,
    genus: draft.genus,
    description: draft.description,
    conservation_status: draft.conservation_status,
    distribution: draft.distribution,
    ecological_info: draft.ecological_info,
    cultural_significance: draft.cultural_significance,
  };
}

function plantColumns(draft: PlantDraft, speciesId: string) {
  return {
    plant_name: draft.plant_name,
    life_stage: draft.life_stage,
    species_id: speciesId,
    height_m: draft.height_m,
    trunk_diameter_cm: draft.trunk_diameter_cm,
    leaf_traits: draft.leaf_traits,
    flower_fruit_traits: draft.flower_fruit_traits,
    health_status: draft.health_status,
    other_traits: draft.other_traits,
    location_name: draft.location_name,
    latitude: draft.latitude,
    longitude: draft.longitude,
    visibility: draft.visibility,
  };
}

async function commitSpecies(supabase: SupabaseClient, userId: string, draft: PlantDraft) {
  const text = speciesText(draft);
  if (!text.scientific_name) return { id: null as string | null, error: "Enter a scientific name." };
  if (draft.new_species_name) {
    const { data: existing } = await supabase
      .from("species")
      .select("uuid, scientific_name")
      .ilike("scientific_name", text.scientific_name)
      .is("hidden_at", null);
    const match = (existing ?? []).find(
      (item) => String(item.scientific_name).toLowerCase() === text.scientific_name.toLowerCase(),
    );
    if (match) {
      const { error } = await supabase.from("species").update(text).eq("uuid", match.uuid);
      if (error) return { id: null, error: error.message };
      return { id: String(match.uuid), error: null as string | null };
    }
    const { data, error } = await supabase
      .from("species")
      .insert({ ...text, created_by: userId })
      .select("uuid")
      .single();
    if (error || !data) return { id: null, error: error?.message ?? "Could not add the species." };
    return { id: String(data.uuid), error: null as string | null };
  }
  if (!draft.species_id) return { id: null, error: "Choose a species." };
  const { error } = await supabase.from("species").update(text).eq("uuid", draft.species_id);
  if (error) return { id: null, error: error.message };
  return { id: draft.species_id, error: null };
}

/** Write species text and this plant's fields. Does not change the plant id, QR code, or approval status. */
export async function applyPlantDraft(supabase: SupabaseClient, userId: string, recordUuid: string, draft: PlantDraft) {
  const species = await commitSpecies(supabase, userId, draft);
  if (!species.id) return species.error ?? "Could not save the species.";
  const { error } = await supabase
    .from("plant_records")
    .update(plantColumns(draft, species.id))
    .eq("uuid", recordUuid)
    .eq("status", "approved");
  return error?.message ?? null;
}

export async function hideListedPhotos(supabase: SupabaseClient, recordUuid: string, ids: string[]) {
  if (ids.length === 0) return null;
  const { error } = await supabase
    .from("plant_photos")
    .update({ hidden_at: new Date().toISOString() })
    .in("id", ids)
    .eq("plant_record_id", recordUuid);
  return error?.message ?? null;
}

export async function publishPendingPhotos(supabase: SupabaseClient, updateId: string) {
  const { error } = await supabase
    .from("plant_photos")
    .update({ hidden_at: null, pending_update_id: null })
    .eq("pending_update_id", updateId);
  return error?.message ?? null;
}

export async function discardPendingPhotos(supabase: SupabaseClient, updateId: string) {
  const { error } = await supabase
    .from("plant_photos")
    .update({ hidden_at: new Date().toISOString() })
    .eq("pending_update_id", updateId);
  return error?.message ?? null;
}

export async function attachPlantPhoto(
  supabase: SupabaseClient,
  userId: string,
  recordUuid: string,
  formData: FormData,
  pendingUpdateId: string | null,
) {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;
  const uploaded = await uploadPlantPhoto(supabase as Parameters<typeof uploadPlantPhoto>[0], userId, photo);
  if (uploaded.error || !uploaded.path) return uploaded.error ?? "Could not upload the photo.";
  const { error } = await supabase.from("plant_photos").insert({
    plant_record_id: recordUuid,
    storage_path: uploaded.path,
    caption: textOrNull(formData.get("photo_caption")),
    uploaded_by: userId,
    hidden_at: pendingUpdateId ? new Date().toISOString() : null,
    pending_update_id: pendingUpdateId,
  });
  return error?.message ?? null;
}

export function updateRowPayload(draft: PlantDraft) {
  return {
    plant_name: draft.plant_name,
    life_stage: draft.life_stage,
    species_id: draft.species_id,
    new_species_name: draft.new_species_name,
    height_m: draft.height_m,
    trunk_diameter_cm: draft.trunk_diameter_cm,
    leaf_traits: draft.leaf_traits,
    flower_fruit_traits: draft.flower_fruit_traits,
    health_status: draft.health_status,
    other_traits: draft.other_traits,
    location_name: draft.location_name,
    latitude: draft.latitude,
    longitude: draft.longitude,
    visibility: draft.visibility,
    scientific_name: draft.scientific_name,
    common_name: draft.common_name,
    local_name: draft.local_name,
    family: draft.family,
    genus: draft.genus,
    description: draft.description,
    conservation_status: draft.conservation_status,
    distribution: draft.distribution,
    ecological_info: draft.ecological_info,
    cultural_significance: draft.cultural_significance,
    hide_photo_ids: draft.hide_photo_ids,
  };
}
