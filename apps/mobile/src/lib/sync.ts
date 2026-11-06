import {
  countDrafts,
  deleteDraft,
  getDraftByQr,
  getRecordByQr,
  listDrafts,
  replaceRecords,
  replaceSpecies,
  saveDraft,
} from "@/lib/db";
import { speciesPhoto, storageObjectPath } from "@/lib/photo-path";
import { cachePhotoFiles, deleteLocalPhoto, photoTimestamps, uploadPlantPhoto } from "@/lib/photos";
import { numberOrNull, plantCodePrefix, qrCodeForRecord, textOrNull } from "@/lib/plant";
import {
  cachedPublicDetail,
  forgetPublicPlant,
  rememberFetchedPlant,
  resolveCanonicalPlantTag,
} from "@/lib/publicPlants";
import { supabase } from "@/lib/supabase";
import type { CachedRecord, Draft, LocalPhoto, PhotoRef, Profile, PublicPlant, Species } from "@/types";

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
  botanist_id?: string | null;
  local_id?: string | null;
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
  const qrCode = draft.qr_code || (draft.status === "submitted" ? qrCodeForRecord(draft.local_id) : null);
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
    qr_code: qrCode,
    status: draft.status,
    sync_status: "synced",
  };
}

// Uploads every photo of a draft. Returns the photo list with `remote_url` filled in for each
// one that reached storage, so a retry only sends the photos that are still missing.
async function attachPhotos(draft: Draft, recordId: string) {
  const photos: LocalPhoto[] = [...(draft.photos ?? [])];

  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index]!;
    let url = photo.remote_url;
    if (!url) {
      const uploaded = await uploadPlantPhoto(draft.user_id, `${draft.local_id}-${photo.id}`, photo.uri);
      if (!uploaded.url) {
        return { error: uploaded.error ?? "Could not upload the photograph.", photos };
      }
      url = uploaded.url;
      photos[index] = { ...photo, remote_url: url };
    }

    const existing = await supabase
      .from("plant_photos")
      .select("id")
      .eq("plant_record_id", recordId)
      .eq("storage_path", url)
      .maybeSingle();
    if (existing.error) return { error: existing.error.message, photos };
    if (!existing.data) {
      const inserted = await supabase.from("plant_photos").insert({
        plant_record_id: recordId,
        storage_path: url,
        caption: textOrNull(photo.caption),
        uploaded_by: draft.user_id,
      });
      // Duplicate path is fine; RLS/permission failures are handled by the caller.
      if (inserted.error && inserted.error.code !== "23505") {
        const message = /row-level security/i.test(inserted.error.message)
          ? 'Could not save the photograph. Ask an administrator to run apps/mobile/supabase/plant-photos.sql.'
          : inserted.error.message;
        return { error: message, photos };
      }
    }
  }

  return { error: null as string | null, photos };
}

async function ensureRemoteQr(recordId: string, qrCode: string | null) {
  if (!qrCode) return null;
  const existing = await supabase.from("plant_records").select("qr_code").eq("uuid", recordId).maybeSingle();
  if (existing.error) return existing.error.message;
  if (existing.data?.qr_code === qrCode) return null;
  // Keep a server code that was already published under a different value (legacy approve mint).
  if (existing.data?.qr_code) return null;

  const updated = await supabase.from("plant_records").update({ qr_code: qrCode }).eq("uuid", recordId);
  if (updated.error) {
    return /permission|row-level security/i.test(updated.error.message)
      ? "Could not save the QR code on the server. Ask an administrator to run apps/mobile/supabase/qr-at-submit.sql."
      : updated.error.message;
  }

  const verify = await supabase.from("plant_records").select("qr_code").eq("uuid", recordId).maybeSingle();
  if (verify.error) return verify.error.message;
  if (verify.data?.qr_code !== qrCode) {
    return "Could not save the QR code on the server. Ask an administrator to allow botanists to set qr_code.";
  }
  return null;
}

async function findRemoteByLocalId(localId: string) {
  const found = await supabase.from("plant_records").select("uuid, qr_code").eq("local_id", localId).maybeSingle();
  if (found.error) return { recordId: null as string | null, error: found.error.message };
  if (!found.data?.uuid) return { recordId: null as string | null, error: null };
  return { recordId: found.data.uuid as string, error: null };
}

async function uploadDrafts(userId: string): Promise<SyncResult> {
  const drafts = await listDrafts(userId);
  let uploaded = 0;

  for (const draft of drafts) {
    const payload = recordPayload(draft);
    let recordId = draft.remote_uuid;

    // Already uploaded earlier but draft was kept (e.g. QR ensure used to block cleanup).
    if (!recordId) {
      const existing = await findRemoteByLocalId(draft.local_id);
      if (existing.error) {
        await saveDraft({ ...draft, sync_error: existing.error });
        return { uploaded, error: existing.error };
      }
      recordId = existing.recordId;
    }

    if (!recordId) {
      const inserted = await supabase.from("plant_records").insert(payload).select("uuid, qr_code").single();
      if (inserted.error) {
        if (inserted.error.code === "23505") {
          const found = await findRemoteByLocalId(draft.local_id);
          if (found.error || !found.recordId) {
            const message = found.error ?? inserted.error.message;
            await saveDraft({ ...draft, sync_error: message });
            return { uploaded, error: message };
          }
          recordId = found.recordId;
        } else {
          await saveDraft({ ...draft, sync_error: inserted.error.message });
          return { uploaded, error: inserted.error.message };
        }
      } else {
        recordId = inserted.data.uuid;
      }
    }

    if (!recordId) return { uploaded, error: "The central database did not return a record id." };

    // Best-effort only. The plant_records row is already on the server — never keep a
    // local "waiting to upload" ghost because QR or photo RLS failed afterward.
    await ensureRemoteQr(recordId, payload.qr_code);
    const attached = await attachPhotos(draft, recordId);

    // Only remove the app's own copies, never an original from the phone's gallery.
    for (const photo of attached.photos) {
      if (photo.uri.startsWith("file:") && photo.uri.includes("/photos/")) {
        await deleteLocalPhoto(photo.uri).catch(() => undefined);
      }
    }
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

async function repairClientQrCodes(userId: string) {
  const rows = await supabase
    .from("plant_records")
    .select("uuid, local_id, qr_code")
    .eq("botanist_id", userId)
    .not("local_id", "is", null);
  if (rows.error || !rows.data) return;

  for (const row of rows.data) {
    if (typeof row.local_id !== "string" || row.local_id.length < 8) continue;
    const expected = qrCodeForRecord(row.local_id);
    // Only fill missing codes. Never replace a tag that may already be printed or published.
    if (row.qr_code) continue;
    await supabase
      .from("plant_records")
      .update({ qr_code: expected })
      .eq("uuid", row.uuid)
      .eq("botanist_id", userId)
      .is("qr_code", null);
  }
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

  // Repair offline tags: if local_id exists, qr_code must be plant-{local_id[0:8]} so printed QRs keep working.
  await repairClientQrCodes(profile.uuid);

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
  | { kind: "draft"; draft: Draft }
  | { kind: "missing"; offline: boolean };

function textField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

async function lookupPublicHit(code: string): Promise<TagHit | null> {
  try {
    const page = await supabase.from("public_plant_pages").select("*").eq("qr_code", code).maybeSingle();
    if (page.error || !page.data) {
      if (!page.error) await forgetPublicPlant(code).catch(() => undefined);
      return null;
    }
    const row = page.data as Record<string, unknown>;
    const photos = await supabase.from("public_plant_photos").select("storage_path, caption").eq("qr_code", code);
    const visible = photos.error ? [] : await cachePhotoFiles((photos.data ?? []) as PhotoRef[]);
    const saved = await rememberFetchedPlant(row, visible).catch(() => null);
    return {
      kind: "public",
      plant: saved ?? {
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
      photos: visible,
    };
  } catch {
    return null;
  }
}

function recordFromApi(row: RecordApi, userId = ""): CachedRecord {
  const species = one(row.species);
  return {
    uuid: row.uuid,
    user_id: row.botanist_id || userId,
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
  };
}

async function lookupRemoteRecord(code: string): Promise<TagHit | null> {
  const select =
    "uuid, id, botanist_id, plant_name, life_stage, species_id, status, location_name, latitude, longitude, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits, qr_code, review_note, recorded_at, local_id, species(scientific_name, common_name)";
  const remote = await supabase.from("plant_records").select(select).eq("qr_code", code).maybeSingle();
  if (!remote.error && remote.data) return { kind: "record", record: recordFromApi(remote.data as RecordApi) };

  const prefix = plantCodePrefix(code);
  if (!prefix) return null;
  const aliased = await supabase
    .from("plant_records")
    .select(select)
    .or(`local_id.ilike.${prefix}%,uuid.ilike.${prefix}%`)
    .limit(5);
  if (aliased.error) return null;
  const hit = (aliased.data ?? []).find((row) => {
    const local = typeof (row as { local_id?: string }).local_id === "string" ? (row as { local_id: string }).local_id.toLowerCase() : "";
    const uuid = typeof row.uuid === "string" ? row.uuid.toLowerCase() : "";
    return local.startsWith(prefix) || uuid.startsWith(prefix);
  });
  return hit ? { kind: "record", record: recordFromApi(hit as RecordApi) } : null;
}

export async function lookupTag(code: string, online: boolean): Promise<TagHit> {
  // Unsynced offline submit — prefer the phone draft.
  const localDraft = await getDraftByQr(code);
  if (localDraft) return { kind: "draft", draft: localDraft };

  // Online: published page wins so staff see the guest plant view after approve.
  if (online) {
    const published = await lookupPublicHit(code);
    if (published) return published;

    // Offline-printed tags may use local_id while the public page uses a later server mint.
    const resolved = await resolveCanonicalPlantTag(code).catch(() => null);
    if (resolved?.qr_code && resolved.qr_code !== code) {
      const aliasedPublic = await lookupPublicHit(resolved.qr_code);
      if (aliasedPublic) return aliasedPublic;
    }
  }

  const cached = await cachedPublicDetail(code).catch(() => null);
  if (cached) return { kind: "public", plant: cached, photos: cached.photos };

  const local = await getRecordByQr(code);
  if (online) {
    const remote = await lookupRemoteRecord(code);
    if (remote) return remote;
    // Stale local submitted row after remote approve may still help offline-ish reconnects.
    if (local) return { kind: "record", record: local };
    return { kind: "missing", offline: false };
  }

  if (local) return { kind: "record", record: local };
  return { kind: "missing", offline: true };
}
