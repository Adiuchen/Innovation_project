import {
  countDrafts,
  deleteDraft,
  getRecordByQr,
  listDrafts,
  replaceRecords,
  replaceSpecies,
  saveDraft,
} from "@/lib/db";
import { speciesPhoto, storageObjectPath } from "@/lib/photo-path";
import { cachePhotoFiles, deleteLocalPhoto, photoTimestamps, uploadPlantPhoto } from "@/lib/photos";
import { numberOrNull, textOrNull } from "@/lib/plant";
import { supabase } from "@/lib/supabase";
import type { CachedRecord, Draft, PhotoRef, Profile, PublicPlant, Species } from "@/types";

export type SyncResult = {
  uploaded: number;
  error: string | null;
};

type SpeciesApi = {
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

type PhotoApi = {
  species_id: string | null;
  plant_record_id: string | null;
  storage_path: string;
  caption: string | null;
};

type RecordApi = {
  uuid: string;
  id: string | null;
  species_id: string | null;
  plant_name: string | null;
  life_stage: string | null;
  status: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  height_m: number | null;
  trunk_diameter_cm: number | null;
  leaf_traits: string | null;
  flower_fruit_traits: string | null;
  health_status: string | null;
  other_traits: string | null;
  qr_code: string | null;
  review_note: string | null;
  recorded_at: string | null;
  species:
    | { scientific_name?: string | null; common_name?: string | null }
    | { scientific_name?: string | null; common_name?: string | null }[]
    | null;
};

function one<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

let syncing: Promise<SyncResult> | null = null;

function recordPayload(draft: Draft) {
  return {
    botanist_id: draft.user_id,
    local_id: draft.local_id,
    plant_name: textOrNull(draft.plant_name),
    life_stage: textOrNull(draft.life_stage),
    species_id: draft.species_id,
    height_m: numberOrNull(draft.height_m),
    trunk_diameter_cm: numberOrNull(draft.trunk_diameter_cm),
    leaf_traits: textOrNull(draft.leaf_traits),
    flower_fruit_traits: textOrNull(draft.flower_fruit_traits),
    health_status: textOrNull(draft.health_status),
    other_traits: textOrNull(draft.other_traits),
    location_name: textOrNull(draft.location_name),
    latitude: numberOrNull(draft.latitude),
    longitude: numberOrNull(draft.longitude),
    status: draft.status,
    sync_status: "synced",
  };
}

async function attachPhoto(draft: Draft, recordId: string) {
  if (!draft.photo_uri && !draft.photo_remote_url) {
    return { error: null as string | null, photo_remote_url: null as string | null };
  }

  let url = draft.photo_remote_url;
  if (!url && draft.photo_uri) {
    const uploaded = await uploadPlantPhoto(draft.user_id, draft.local_id, draft.photo_uri);
    if (!uploaded.url) {
      return { error: uploaded.error ?? "Could not upload the photograph.", photo_remote_url: null };
    }
    url = uploaded.url;
  }
  if (!url) return { error: null, photo_remote_url: null };

  const existing = await supabase
    .from("plant_photos")
    .select("id")
    .eq("plant_record_id", recordId)
    .eq("storage_path", url)
    .maybeSingle();
  if (existing.error) return { error: existing.error.message, photo_remote_url: url };
  if (!existing.data) {
    const inserted = await supabase.from("plant_photos").insert({
      plant_record_id: recordId,
      storage_path: url,
      caption: textOrNull(draft.photo_caption),
      uploaded_by: draft.user_id,
    });
    if (inserted.error) return { error: inserted.error.message, photo_remote_url: url };
  }
  return { error: null, photo_remote_url: url };
}

async function uploadDrafts(userId: string): Promise<SyncResult> {
  const drafts = await listDrafts(userId);
  let uploaded = 0;

  for (const draft of drafts) {
    let recordId = draft.remote_uuid;
    if (!recordId) {
      const inserted = await supabase.from("plant_records").insert(recordPayload(draft)).select("uuid").single();
      if (inserted.error) {
        if (inserted.error.code === "23505") {
          const found = await supabase
            .from("plant_records")
            .select("uuid")
            .eq("local_id", draft.local_id)
            .maybeSingle();
          if (found.error || !found.data) {
            const message = found.error?.message ?? inserted.error.message;
            await saveDraft({ ...draft, sync_error: message });
            return { uploaded, error: message };
          }
          recordId = found.data.uuid;
        } else {
          await saveDraft({ ...draft, sync_error: inserted.error.message });
          return { uploaded, error: inserted.error.message };
        }
      } else {
        recordId = inserted.data.uuid;
      }
    }

    if (!recordId) return { uploaded, error: "The central database did not return a record id." };

    const attached = await attachPhoto(draft, recordId);
    if (attached.error) {
      await saveDraft({
        ...draft,
        remote_uuid: recordId,
        photo_remote_url: attached.photo_remote_url,
        sync_error: attached.error,
      });
      return { uploaded, error: attached.error };
    }

    await deleteLocalPhoto(draft.photo_uri);
    await deleteDraft(draft.local_id);
    uploaded += 1;
  }

  return { uploaded, error: null };
}

export function syncDrafts(userId: string) {
  if (!syncing) {
    syncing = uploadDrafts(userId).finally(() => {
      syncing = null;
    });
  }
  return syncing;
}

export async function refreshReferenceData(profile: Profile) {
  const speciesResult = await supabase
    .from("species")
    .select(
      "uuid, id, scientific_name, common_name, local_name, family, genus, description, conservation_status, distribution, ecological_info, cultural_significance",
    )
    .order("scientific_name");

  if (speciesResult.error) return speciesResult.error.message;

  const speciesPhotos = await supabase.from("public_species_photos").select("species_id, storage_path, caption");

  const photosBySpecies = new Map<string, PhotoRef[]>();
  if (!speciesPhotos.error) {
    for (const photo of (speciesPhotos.data ?? []) as PhotoApi[]) {
      if (!photo.species_id || !photo.storage_path) continue;
      const list = photosBySpecies.get(photo.species_id) ?? [];
      list.push({ storage_path: photo.storage_path, caption: photo.caption });
      photosBySpecies.set(photo.species_id, list);
    }
  }

  const uploadedAt = speciesPhotos.error ? new Map<string, string>() : await photoTimestamps();
  const species: Species[] = [];
  for (const item of (speciesResult.data ?? []) as SpeciesApi[]) {
    const chosen = speciesPhoto(photosBySpecies.get(item.uuid) ?? [], (path) => {
      const objectPath = storageObjectPath(path);
      return (objectPath && uploadedAt.get(objectPath)) || null;
    });
    species.push({
      uuid: item.uuid,
      code: item.id,
      scientific_name: item.scientific_name,
      common_name: item.common_name,
      local_name: item.local_name,
      family: item.family,
      genus: item.genus,
      description: item.description,
      conservation_status: item.conservation_status,
      distribution: item.distribution,
      ecological_info: item.ecological_info,
      cultural_significance: item.cultural_significance,
      photos: chosen ? [chosen] : [],
    });
  }
  await replaceSpecies(species);
  await cachePhotoFiles(species.flatMap((item) => item.photos));

  if (profile.role !== "botanist") return null;

  const recordsResult = await supabase
    .from("plant_records")
    .select(
      "uuid, id, plant_name, life_stage, species_id, status, location_name, latitude, longitude, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits, qr_code, review_note, recorded_at, species(scientific_name, common_name)",
    )
    .eq("botanist_id", profile.uuid)
    .order("recorded_at", { ascending: false });

  if (recordsResult.error) return recordsResult.error.message;

  const rows = (recordsResult.data ?? []) as RecordApi[];
  const ids = rows.map((row) => row.uuid);
  const photosByRecord = new Map<string, PhotoRef[]>();
  if (ids.length > 0) {
    const recordPhotos = await supabase
      .from("plant_photos")
      .select("plant_record_id, storage_path, caption")
      .in("plant_record_id", ids);
    if (!recordPhotos.error) {
      for (const photo of (recordPhotos.data ?? []) as PhotoApi[]) {
        if (!photo.plant_record_id) continue;
        const list = photosByRecord.get(photo.plant_record_id) ?? [];
        list.push({ storage_path: photo.storage_path, caption: photo.caption });
        photosByRecord.set(photo.plant_record_id, list);
      }
    }
  }

  const records: CachedRecord[] = [];
  for (const row of rows) {
    const species = one(row.species);
    const photos = await cachePhotoFiles(photosByRecord.get(row.uuid) ?? []);
    records.push({
      uuid: row.uuid,
      user_id: profile.uuid,
      code: row.id,
      species_id: row.species_id,
      species_name: species?.scientific_name ?? null,
      common_name: species?.common_name ?? null,
      plant_name: row.plant_name,
      life_stage: row.life_stage,
      status: row.status,
      location_name: row.location_name,
      latitude: row.latitude,
      longitude: row.longitude,
      height_m: row.height_m,
      trunk_diameter_cm: row.trunk_diameter_cm,
      leaf_traits: row.leaf_traits,
      flower_fruit_traits: row.flower_fruit_traits,
      health_status: row.health_status,
      other_traits: row.other_traits,
      qr_code: row.qr_code,
      review_note: row.review_note,
      recorded_at: row.recorded_at,
      photos,
    });
  }
  await replaceRecords(profile.uuid, records);
  return null;
}

export async function pendingCount(userId: string) {
  return countDrafts(userId);
}

export async function cachedTag(code: string) {
  return getRecordByQr(code);
}

export type TagHit =
  | { kind: "public"; plant: PublicPlant; photos: PhotoRef[] }
  | { kind: "record"; record: CachedRecord }
  | { kind: "missing"; offline: boolean };

function textField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

export async function lookupTag(code: string, online: boolean): Promise<TagHit> {
  if (online) {
    const page = await supabase.from("public_plant_pages").select("*").eq("qr_code", code).maybeSingle();
    if (!page.error && page.data) {
      const row = page.data as Record<string, unknown>;
      const photos = await supabase
        .from("public_plant_photos")
        .select("storage_path, caption")
        .eq("qr_code", code);
      return {
        kind: "public",
        plant: {
          qr_code: textField(row, "qr_code") ?? code,
          scientific_name: textField(row, "scientific_name"),
          common_name: textField(row, "common_name"),
          local_name: textField(row, "local_name"),
          family: textField(row, "family"),
          genus: textField(row, "genus"),
          conservation_status: textField(row, "conservation_status"),
          distribution: textField(row, "distribution"),
          description: textField(row, "description"),
          ecological_info: textField(row, "ecological_info"),
          cultural_significance: textField(row, "cultural_significance"),
          health_status: textField(row, "health_status"),
        },
        photos: photos.error ? [] : await cachePhotoFiles((photos.data ?? []) as PhotoRef[]),
      };
    }
  }

  const local = await getRecordByQr(code);
  if (local) return { kind: "record", record: local };

  if (!online) return { kind: "missing", offline: true };

  const remote = await supabase
    .from("plant_records")
    .select(
      "uuid, id, plant_name, life_stage, species_id, status, location_name, latitude, longitude, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits, qr_code, review_note, recorded_at, species(scientific_name, common_name)",
    )
    .eq("qr_code", code)
    .maybeSingle();
  if (!remote.error && remote.data) {
    const row = remote.data as RecordApi;
    const species = one(row.species);
    return {
      kind: "record",
      record: {
        uuid: row.uuid,
        user_id: "",
        code: row.id,
        species_id: row.species_id,
        species_name: species?.scientific_name ?? null,
        common_name: species?.common_name ?? null,
        plant_name: row.plant_name,
        life_stage: row.life_stage,
        status: row.status,
        location_name: row.location_name,
        latitude: row.latitude,
        longitude: row.longitude,
        height_m: row.height_m,
        trunk_diameter_cm: row.trunk_diameter_cm,
        leaf_traits: row.leaf_traits,
        flower_fruit_traits: row.flower_fruit_traits,
        health_status: row.health_status,
        other_traits: row.other_traits,
        qr_code: row.qr_code,
        review_note: row.review_note,
        recorded_at: row.recorded_at,
        photos: [],
      },
    };
  }

  return { kind: "missing", offline: false };
}
