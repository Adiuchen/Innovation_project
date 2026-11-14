import AsyncStorage from "@react-native-async-storage/async-storage";
import { newId } from "@/lib/id";
import { numberOrNull, plantVisibility, textOrNull } from "@/lib/plant";
import { uploadPlantPhoto } from "@/lib/photos";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

export type UpdateRequest = {
  uuid: string;
  plantRecordId: string;
  plantName: string;
  status: "open" | "submitted";
};

export type UpdateLoad = {
  rows: UpdateRequest[];
  error: string | null;
};

const cacheKey = (userId: string) => `plant-update-requests:${userId}`;

function mapRows(data: unknown[]): UpdateRequest[] {
  return data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.uuid !== "string") return [];
    return [
      {
        uuid: row.uuid,
        plantRecordId: typeof row.plant_record_id === "string" ? row.plant_record_id : "",
        plantName: typeof row.plant_name === "string" ? row.plant_name : "",
        status: row.status === "submitted" ? "submitted" : "open",
      },
    ];
  });
}

function storedRequests(value: unknown): UpdateRequest[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<UpdateRequest>;
    if (typeof row.uuid !== "string" || (row.status !== "open" && row.status !== "submitted")) return [];
    return [
      {
        uuid: row.uuid,
        plantRecordId: typeof row.plantRecordId === "string" ? row.plantRecordId : "",
        plantName: typeof row.plantName === "string" ? row.plantName : "",
        status: row.status,
      },
    ];
  });
}

async function readCache(userId: string): Promise<UpdateRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    return raw ? storedRequests(JSON.parse(raw) as unknown) : [];
  } catch {
    return [];
  }
}

async function signedInSession() {
  const { data } = await supabase.auth.getSession();
  let session = data.session;
  if (!session?.access_token) return null;
  const expiresAt = session.expires_at ?? 0;
  if (expiresAt * 1000 < Date.now() + 30_000) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session ?? session;
  }
  return session.access_token && session.user?.id ? session : null;
}

async function requestUpdates(token: string, ownerId: string, order: boolean) {
  const url = new URL("/rest/v1/plant_updates", supabaseUrl);
  url.searchParams.set("select", "uuid,plant_name,plant_record_id,status");
  url.searchParams.set("botanist_id", `eq.${ownerId}`);
  url.searchParams.set("status", "in.(open,submitted)");
  if (order) url.searchParams.set("order", "created_at.desc");
  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Could not load update requests (${response.status}).`;
    return { rows: null as UpdateRequest[] | null, error: message };
  }
  if (!Array.isArray(body)) return { rows: null, error: "Could not load update requests." };
  return { rows: mapRows(body), error: null as string | null };
}

/**
 * Open and submitted plant updates for the signed-in botanist.
 * The website uses the auth user id, so this query does too, and sends that user's token itself.
 * A failed query keeps the last successful list and returns the error instead of looking like there is nothing to do.
 */
export async function listOpenPlantUpdates(userId: string): Promise<UpdateLoad> {
  const cached = await readCache(userId);
  if (!supabaseUrl || !supabaseAnonKey) {
    return { rows: cached, error: cached.length ? null : "This build is missing the Supabase URL or publishable key." };
  }
  const session = await signedInSession();
  if (!session?.access_token || !session.user?.id) {
    return { rows: cached, error: cached.length ? null : "Sign in again to load update requests." };
  }
  let result = await requestUpdates(session.access_token, session.user.id, true);
  if (result.error && /created_at|order|column/i.test(result.error)) {
    result = await requestUpdates(session.access_token, session.user.id, false);
  }
  if (result.error || !result.rows) return { rows: cached, error: result.error };
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(result.rows)).catch(() => undefined);
  return { rows: result.rows, error: null };
}

export type PlantUpdateDraft = {
  plant_name: string;
  visibility: "ordinary" | "rare";
  species_id: string | null;
  new_species: boolean;
  scientific_name: string;
  common_name: string;
  local_name: string;
  family: string;
  genus: string;
  description: string;
  conservation_status: string;
  distribution: string;
  ecological_info: string;
  cultural_significance: string;
  height_m: string;
  trunk_diameter_cm: string;
  latitude: string;
  longitude: string;
  location_name: string;
  life_stage: string;
  health_status: string;
  leaf_traits: string;
  flower_fruit_traits: string;
  other_traits: string;
  hide_photo_ids: string[];
};

export type LoadedPlantUpdate = {
  uuid: string;
  plantRecordId: string;
  status: "open" | "submitted";
  draft: PlantUpdateDraft;
};

export type UpdatePhoto = {
  id: string;
  storage_path: string;
  caption: string | null;
  pending: boolean;
};

function textValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

export function draftFromUpdateRow(row: Record<string, unknown>): PlantUpdateDraft {
  const speciesId = typeof row.species_id === "string" ? row.species_id : null;
  return {
    plant_name: textValue(row.plant_name),
    visibility: plantVisibility(row.visibility),
    species_id: speciesId,
    new_species: !speciesId && Boolean(textValue(row.new_species_name) || textValue(row.scientific_name)),
    scientific_name: textValue(row.scientific_name) || textValue(row.new_species_name),
    common_name: textValue(row.common_name),
    local_name: textValue(row.local_name),
    family: textValue(row.family),
    genus: textValue(row.genus),
    description: textValue(row.description),
    conservation_status: textValue(row.conservation_status),
    distribution: textValue(row.distribution),
    ecological_info: textValue(row.ecological_info),
    cultural_significance: textValue(row.cultural_significance),
    height_m: textValue(row.height_m),
    trunk_diameter_cm: textValue(row.trunk_diameter_cm),
    latitude: textValue(row.latitude),
    longitude: textValue(row.longitude),
    location_name: textValue(row.location_name),
    life_stage: textValue(row.life_stage),
    health_status: textValue(row.health_status),
    leaf_traits: textValue(row.leaf_traits),
    flower_fruit_traits: textValue(row.flower_fruit_traits),
    other_traits: textValue(row.other_traits),
    hide_photo_ids: stringList(row.hide_photo_ids),
  };
}

function updatePayload(draft: PlantUpdateDraft, intent: "draft" | "submit") {
  const scientific = textOrNull(draft.scientific_name);
  return {
    plant_name: textOrNull(draft.plant_name),
    life_stage: textOrNull(draft.life_stage),
    species_id: draft.new_species ? null : draft.species_id,
    new_species_name: draft.new_species ? scientific : null,
    height_m: numberOrNull(draft.height_m),
    trunk_diameter_cm: numberOrNull(draft.trunk_diameter_cm),
    leaf_traits: textOrNull(draft.leaf_traits),
    flower_fruit_traits: textOrNull(draft.flower_fruit_traits),
    health_status: textOrNull(draft.health_status),
    other_traits: textOrNull(draft.other_traits),
    location_name: textOrNull(draft.location_name),
    latitude: numberOrNull(draft.latitude),
    longitude: numberOrNull(draft.longitude),
    visibility: draft.visibility,
    scientific_name: scientific,
    common_name: textOrNull(draft.common_name),
    local_name: textOrNull(draft.local_name),
    family: textOrNull(draft.family),
    genus: textOrNull(draft.genus),
    description: textOrNull(draft.description),
    conservation_status: textOrNull(draft.conservation_status),
    distribution: textOrNull(draft.distribution),
    ecological_info: textOrNull(draft.ecological_info),
    cultural_significance: textOrNull(draft.cultural_significance),
    hide_photo_ids: draft.hide_photo_ids,
    status: intent === "submit" ? "submitted" : "open",
    submitted_at: intent === "submit" ? new Date().toISOString() : null,
  };
}

/** Same checks as the website update form. Save can skip them; submit cannot. */
export function updateProblems(draft: PlantUpdateDraft) {
  if (!textOrNull(draft.plant_name)) return "Enter a plant name.";
  if (!draft.new_species && !draft.species_id) return "Choose a species.";
  if (!textOrNull(draft.scientific_name)) return "Enter a scientific name.";
  if (!textOrNull(draft.life_stage)) return "Choose a life stage.";
  if (!textOrNull(draft.health_status)) return "Choose a health status.";
  if (!textOrNull(draft.leaf_traits)) return "Choose leaf traits.";
  if (!textOrNull(draft.flower_fruit_traits)) return "Choose flower or fruit traits.";
  if (!textOrNull(draft.other_traits)) return "Enter other traits.";
  if (numberOrNull(draft.height_m) == null) return "Enter height.";
  if (numberOrNull(draft.trunk_diameter_cm) == null) return "Enter trunk diameter.";
  if (numberOrNull(draft.latitude) == null) return "Enter latitude.";
  if (numberOrNull(draft.longitude) == null) return "Enter longitude.";
  if (!textOrNull(draft.location_name)) return "Enter a place name.";
  return null;
}

function errorMessage(body: unknown, fallback: string) {
  return body && typeof body === "object" && "message" in body && typeof body.message === "string" ? body.message : fallback;
}

export async function loadPlantUpdate(updateId: string): Promise<{ update: LoadedPlantUpdate | null; error: string | null }> {
  const session = await signedInSession();
  if (!session?.access_token || !session.user?.id) return { update: null, error: "Sign in again to update this plant." };
  const url = new URL("/rest/v1/plant_updates", supabaseUrl);
  url.searchParams.set("select", "*");
  url.searchParams.set("uuid", `eq.${updateId}`);
  url.searchParams.set("botanist_id", `eq.${session.user.id}`);
  url.searchParams.set("status", "in.(open,submitted)");
  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      Accept: "application/json",
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) return { update: null, error: errorMessage(body, "Could not open this update.") };
  const row = Array.isArray(body) ? body[0] : null;
  if (!row || typeof row !== "object") return { update: null, error: "This update is no longer open." };
  const record = row as Record<string, unknown>;
  return {
    update: {
      uuid: String(record.uuid),
      plantRecordId: typeof record.plant_record_id === "string" ? record.plant_record_id : "",
      status: record.status === "submitted" ? "submitted" : "open",
      draft: draftFromUpdateRow(record),
    },
    error: null,
  };
}

export async function savePlantUpdate(updateId: string, draft: PlantUpdateDraft, intent: "draft" | "submit") {
  if (intent === "submit") {
    const problem = updateProblems(draft);
    if (problem) return problem;
  }
  const session = await signedInSession();
  if (!session?.access_token || !session.user?.id) return "Sign in again to update this plant.";
  const url = new URL("/rest/v1/plant_updates", supabaseUrl);
  url.searchParams.set("uuid", `eq.${updateId}`);
  url.searchParams.set("botanist_id", `eq.${session.user.id}`);
  url.searchParams.set("status", "eq.open");
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(updatePayload(draft, intent)),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) return errorMessage(body, "Could not save this update.");
  if (!Array.isArray(body) || body.length === 0) return "This update can no longer be edited.";
  return null;
}

export async function listUpdatePhotos(recordId: string, updateId: string): Promise<{ photos: UpdatePhoto[]; error: string | null }> {
  if (!recordId) return { photos: [], error: null };
  await signedInSession();
  const { data, error } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption, pending_update_id, hidden_at")
    .eq("plant_record_id", recordId);
  if (error || !data) return { photos: [], error: error?.message ?? "Could not load photos." };
  const photos = data.flatMap((row) => {
    if (typeof row.id !== "string" || typeof row.storage_path !== "string") return [];
    const pending = row.pending_update_id === updateId;
    if (row.pending_update_id && !pending) return [];
    if (row.hidden_at && !pending) return [];
    return [
      {
        id: row.id,
        storage_path: row.storage_path,
        caption: typeof row.caption === "string" ? row.caption : null,
        pending,
      },
    ];
  });
  return { photos, error: null };
}

export async function addPendingUpdatePhoto(recordId: string, updateId: string, uri: string, caption: string) {
  const note = textOrNull(caption);
  if (!note) return "Enter a photo caption.";
  const session = await signedInSession();
  if (!session?.user?.id) return "Sign in again to add a photo.";
  const uploaded = await uploadPlantPhoto(session.user.id, newId(), uri);
  if (uploaded.error || !uploaded.url) return uploaded.error ?? "Could not upload the photo.";
  const { error } = await supabase.from("plant_photos").insert({
    plant_record_id: recordId,
    storage_path: uploaded.url,
    caption: note,
    uploaded_by: session.user.id,
    hidden_at: new Date().toISOString(),
    pending_update_id: updateId,
  });
  return error?.message ?? null;
}

export async function removePendingUpdatePhoto(photoId: string, updateId: string) {
  await signedInSession();
  const { error } = await supabase.from("plant_photos").delete().eq("id", photoId).eq("pending_update_id", updateId);
  return error?.message ?? null;
}
