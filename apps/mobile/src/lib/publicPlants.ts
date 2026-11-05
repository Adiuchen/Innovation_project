import {
  deleteCachedPublicPlant,
  getCachedPublicPlant,
  publicCatalogStatus,
  replaceCachedPublicPlants,
  searchCachedPublicPlants,
  upsertCachedPublicPlant,
  type PublicCatalogStatus,
  type StoredPublicPlant,
} from "@/lib/db";
import { isDisplayablePhoto } from "@/lib/photo-path";
import { cachePhotoFiles } from "@/lib/photos";
import { plantCodePrefix } from "@/lib/plant";
import { supabase } from "@/lib/supabase";
import type { PhotoRef } from "@/types";

export type { PublicCatalogStatus };

export type PublicPlantCard = {
  qr_code: string;
  plant_name: string | null;
  scientific_name: string | null;
  common_name: string | null;
  local_name: string | null;
  conservation_status: string | null;
  health_status: string | null;
  image_path: string | null;
};

export type PublicPlantPhoto = {
  storage_path: string;
  caption: string | null;
};

export type PublicPlantDetail = PublicPlantCard & {
  family: string | null;
  genus: string | null;
  description: string | null;
  distribution: string | null;
  ecological_info: string | null;
  cultural_significance: string | null;
  location_name: string | null;
  height_m: number | null;
  life_stage: string | null;
  photos: PublicPlantPhoto[];
};

function searchNeedle(query: string) {
  return query.trim().replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchPublicPlants(query: string, online = true) {
  if (!online) return (await searchCachedPublicPlants(query)).map(asCard);
  try {
    return await searchRemotePublicPlants(query);
  } catch (error) {
    const cached = (await searchCachedPublicPlants(query)).map(asCard);
    if (cached.length > 0) return cached;
    throw error;
  }
}

async function searchRemotePublicPlants(query: string) {
  const needle = searchNeedle(query);
  let request = supabase
    .from("public_plant_pages")
    .select("qr_code, plant_name, scientific_name, common_name, local_name, conservation_status, health_status")
    .order("plant_name")
    .limit(50);

  if (needle) {
    request = request.or(
      `plant_name.ilike.%${needle}%,scientific_name.ilike.%${needle}%,common_name.ilike.%${needle}%,local_name.ilike.%${needle}%`,
    );
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const plants = ((data ?? []) as Omit<PublicPlantCard, "image_path">[]).map((plant) => ({
    ...plant,
    image_path: null as string | null,
  }));
  const codes = plants.map((plant) => plant.qr_code).filter(Boolean);
  if (codes.length === 0) return plants;

  const photos = await supabase.from("public_plant_photos").select("qr_code, storage_path").in("qr_code", codes);
  if (photos.error || !photos.data) return plants;

  const cover = new Map<string, string>();
  for (const photo of photos.data as { qr_code?: string | null; storage_path?: string | null }[]) {
    if (!photo.qr_code || !photo.storage_path || !isDisplayablePhoto(photo.storage_path) || cover.has(photo.qr_code)) continue;
    cover.set(photo.qr_code, photo.storage_path);
  }
  return plants.map((plant) => ({ ...plant, image_path: cover.get(plant.qr_code) ?? null }));
}

export async function loadPublicPlant(code: string, online = true): Promise<PublicPlantDetail | null> {
  if (!online) return cachedPublicDetail(code);
  try {
    const detail = await fetchRemotePublicPlant(code);
    if (!detail) {
      await deleteCachedPublicPlant(code);
      return null;
    }
    await upsertCachedPublicPlant(storedFromDetail(detail));
    return detail;
  } catch (error) {
    const cached = await cachedPublicDetail(code);
    if (cached) return cached;
    throw error;
  }
}

export type GuestPlantPage =
  | { kind: "plant"; plant: PublicPlantDetail }
  | { kind: "in_progress"; code: string }
  | { kind: "missing"; offline: boolean };

export type ResolvedPlantTag = { qr_code: string; status: string };

/**
 * Map a scanned/printed tag to the canonical server qr_code.
 * Offline submits use plant-{local_id[0:8]}; legacy approve may have minted plant-{server_uuid[0:8]}.
 */
export async function resolveCanonicalPlantTag(code: string): Promise<ResolvedPlantTag | null> {
  const rpc = await supabase.rpc("resolve_plant_tag", { code });
  if (!rpc.error) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : null;
    if (row && typeof row.status === "string") {
      const qr = typeof row.qr_code === "string" && row.qr_code ? row.qr_code : code;
      return { qr_code: qr, status: row.status };
    }
  }

  const byQr = await supabase.from("plant_records").select("qr_code, status").eq("qr_code", code).maybeSingle();
  if (!byQr.error && byQr.data && typeof byQr.data.status === "string") {
    return { qr_code: byQr.data.qr_code || code, status: byQr.data.status };
  }

  const prefix = plantCodePrefix(code);
  if (prefix) {
    const aliased = await supabase
      .from("plant_records")
      .select("qr_code, status, local_id, uuid")
      .or(`local_id.ilike.${prefix}%,uuid.ilike.${prefix}%`)
      .limit(5);
    if (!aliased.error) {
      const hit = (aliased.data ?? []).find((row) => {
        const local = typeof row.local_id === "string" ? row.local_id.toLowerCase() : "";
        const uuid = typeof row.uuid === "string" ? row.uuid.toLowerCase() : "";
        return local.startsWith(prefix) || uuid.startsWith(prefix);
      });
      if (hit && typeof hit.status === "string") {
        return { qr_code: hit.qr_code || code, status: hit.status };
      }
    }
  }

  const progress = await supabase.rpc("plant_tag_progress", { code });
  if (!progress.error) {
    const row = Array.isArray(progress.data) ? progress.data[0] : null;
    if (row && typeof row.status === "string") return { qr_code: code, status: row.status };
  }

  return null;
}

/** Best-effort status for a tag. Never throws — RPC may be undeployed; guests may lack RLS. */
export async function lookupTagStatus(code: string): Promise<string | null> {
  const resolved = await resolveCanonicalPlantTag(code);
  return resolved?.status ?? null;
}

/** When the public view is empty, build a guest page from an approved plant_records row (staff sessions). */
async function fetchApprovedRecordAsPlant(code: string): Promise<PublicPlantDetail | null> {
  const remote = await supabase
    .from("plant_records")
    .select(
      "qr_code, plant_name, life_stage, location_name, height_m, health_status, status, species(scientific_name, common_name, local_name, family, genus, conservation_status, description, distribution, ecological_info, cultural_significance)",
    )
    .eq("qr_code", code)
    .eq("status", "approved")
    .maybeSingle();

  let row = (!remote.error && remote.data ? remote.data : null) as Record<string, unknown> | null;
  if (!row) {
    const prefix = plantCodePrefix(code);
    if (prefix) {
      const aliased = await supabase
        .from("plant_records")
        .select(
          "qr_code, plant_name, life_stage, location_name, height_m, health_status, status, local_id, uuid, species(scientific_name, common_name, local_name, family, genus, conservation_status, description, distribution, ecological_info, cultural_significance)",
        )
        .eq("status", "approved")
        .or(`local_id.ilike.${prefix}%,uuid.ilike.${prefix}%`)
        .limit(5);
      const hit = (aliased.data ?? []).find((item) => {
        const local = typeof item.local_id === "string" ? item.local_id.toLowerCase() : "";
        const uuid = typeof item.uuid === "string" ? item.uuid.toLowerCase() : "";
        return local.startsWith(prefix) || uuid.startsWith(prefix);
      });
      if (hit) row = hit as Record<string, unknown>;
    }
  }
  if (!row) return null;

  const canonical = textField(row, "qr_code") ?? code;
  const speciesRaw = row.species;
  const species = (Array.isArray(speciesRaw) ? speciesRaw[0] : speciesRaw) as Record<string, unknown> | null;
  const photos = await supabase.from("public_plant_photos").select("storage_path, caption").eq("qr_code", canonical);
  const visible = photos.error
    ? []
    : ((photos.data ?? []) as PublicPlantPhoto[]).filter(
        (photo) => photo.storage_path && isDisplayablePhoto(photo.storage_path),
      );

  return {
    qr_code: canonical,
    plant_name: textField(row, "plant_name"),
    scientific_name: textField(species ?? {}, "scientific_name"),
    common_name: textField(species ?? {}, "common_name"),
    local_name: textField(species ?? {}, "local_name"),
    conservation_status: textField(species ?? {}, "conservation_status"),
    health_status: textField(row, "health_status"),
    family: textField(species ?? {}, "family"),
    genus: textField(species ?? {}, "genus"),
    description: textField(species ?? {}, "description"),
    distribution: textField(species ?? {}, "distribution"),
    ecological_info: textField(species ?? {}, "ecological_info"),
    cultural_significance: textField(species ?? {}, "cultural_significance"),
    location_name: textField(row, "location_name"),
    height_m: typeof row.height_m === "number" ? row.height_m : null,
    life_stage: textField(row, "life_stage"),
    image_path: visible[0]?.storage_path ?? null,
    photos: visible,
  };
}

/** Guest / visitor path: approved public page, otherwise In Progress for a known non-approved tag. */
export async function resolveGuestPlantPage(code: string, online = true): Promise<GuestPlantPage> {
  try {
    const plant = await loadPublicPlant(code, online);
    if (plant) return { kind: "plant", plant };
  } catch {
    if (!online) return { kind: "missing", offline: true };
  }

  if (!online) {
    const cached = await cachedPublicDetail(code).catch(() => null);
    if (cached) return { kind: "plant", plant: cached };
    return { kind: "missing", offline: true };
  }

  const resolved = await resolveCanonicalPlantTag(code).catch(() => null);
  const canonical = resolved?.qr_code && resolved.qr_code !== code ? resolved.qr_code : null;
  if (canonical) {
    try {
      const plant = await loadPublicPlant(canonical, true);
      if (plant) return { kind: "plant", plant };
    } catch {
      // Fall through to record / status paths.
    }
  }

  // Approved rows are readable to staff even when public_plant_pages has not caught up.
  const fromRecord = await fetchApprovedRecordAsPlant(canonical ?? code).catch(() => null);
  if (fromRecord) {
    await upsertCachedPublicPlant(storedFromDetail(fromRecord)).catch(() => undefined);
    return { kind: "plant", plant: fromRecord };
  }

  const status = resolved?.status ?? (await lookupTagStatus(code));
  if (status && status !== "approved") return { kind: "in_progress", code };
  return { kind: "missing", offline: false };
}

export async function cachedPublicDetail(code: string): Promise<PublicPlantDetail | null> {
  const stored = await getCachedPublicPlant(code);
  return stored ? asDetail(stored) : null;
}

export async function forgetPublicPlant(code: string) {
  await deleteCachedPublicPlant(code);
}

export async function rememberFetchedPlant(row: Record<string, unknown>, photos: PhotoRef[]) {
  const code = textField(row, "qr_code");
  if (!code) return null;
  const detail = detailFromRow(row, photos, code);
  await upsertCachedPublicPlant(storedFromDetail(detail));
  return detail;
}

export async function downloadPublicCatalog(onProgress?: (label: string) => void): Promise<PublicCatalogStatus> {
  onProgress?.("Downloading plant details…");
  const pages = await eachPage<Record<string, unknown>>("public_plant_pages", "*", "qr_code");
  const photoRows = await eachPage<{ qr_code?: string | null; storage_path?: string | null; caption?: string | null }>(
    "public_plant_photos",
    "qr_code, storage_path, caption",
    "qr_code",
  );
  const covers = new Map<string, PhotoRef>();
  for (const photo of photoRows) {
    if (!photo.qr_code || !photo.storage_path || covers.has(photo.qr_code) || !isDisplayablePhoto(photo.storage_path)) continue;
    covers.set(photo.qr_code, { storage_path: photo.storage_path, caption: photo.caption ?? null });
  }
  onProgress?.("Saving photos onto this phone…");
  try {
    await cachePhotoFiles([...covers.values()]);
  } catch {
    // The written pages still open if a photograph cannot be stored.
  }
  const savedAt = new Date().toISOString();
  const plants = pages.flatMap((row) => {
    const code = textField(row, "qr_code");
    if (!code) return [];
    const cover = covers.get(code);
    return [storedFromDetail(detailFromRow(row, cover ? [cover] : [], code))];
  });
  await replaceCachedPublicPlants(plants, savedAt);
  return { savedAt, plantCount: new Set(plants.map((plant) => plant.qr_code)).size };
}

export function readPublicCatalog() {
  return publicCatalogStatus();
}

async function fetchRemotePublicPlant(code: string): Promise<PublicPlantDetail | null> {
  const page = await supabase.from("public_plant_pages").select("*").eq("qr_code", code).maybeSingle();
  if (page.error) throw new Error(page.error.message);
  if (!page.data) return null;

  const row = page.data as Record<string, unknown>;
  const photos = await supabase.from("public_plant_photos").select("storage_path, caption").eq("qr_code", code);
  const visible = photos.error
    ? []
    : ((photos.data ?? []) as PublicPlantPhoto[]).filter(
        (photo) => photo.storage_path && isDisplayablePhoto(photo.storage_path),
      );
  return detailFromRow(row, visible, code);
}

function detailFromRow(row: Record<string, unknown>, photos: PublicPlantPhoto[], code: string): PublicPlantDetail {
  return {
    qr_code: textField(row, "qr_code") ?? code,
    plant_name: textField(row, "plant_name"),
    scientific_name: textField(row, "scientific_name"),
    common_name: textField(row, "common_name"),
    local_name: textField(row, "local_name"),
    conservation_status: textField(row, "conservation_status"),
    health_status: textField(row, "health_status"),
    family: textField(row, "family"),
    genus: textField(row, "genus"),
    description: textField(row, "description"),
    distribution: textField(row, "distribution"),
    ecological_info: textField(row, "ecological_info"),
    cultural_significance: textField(row, "cultural_significance"),
    location_name: textField(row, "location_name"),
    height_m: typeof row.height_m === "number" ? row.height_m : null,
    life_stage: textField(row, "life_stage"),
    image_path: photos[0]?.storage_path ?? null,
    photos,
  };
}

function storedFromDetail(plant: PublicPlantDetail): StoredPublicPlant {
  return {
    qr_code: plant.qr_code,
    plant_name: plant.plant_name,
    scientific_name: plant.scientific_name,
    common_name: plant.common_name,
    local_name: plant.local_name,
    family: plant.family,
    genus: plant.genus,
    description: plant.description,
    distribution: plant.distribution,
    ecological_info: plant.ecological_info,
    cultural_significance: plant.cultural_significance,
    conservation_status: plant.conservation_status,
    health_status: plant.health_status,
    location_name: plant.location_name,
    life_stage: plant.life_stage,
    height_m: plant.height_m,
    photos: plant.photos,
  };
}

function asDetail(plant: StoredPublicPlant): PublicPlantDetail {
  return { ...plant, image_path: plant.photos[0]?.storage_path ?? null };
}

function asCard(plant: StoredPublicPlant): PublicPlantCard {
  return {
    qr_code: plant.qr_code,
    plant_name: plant.plant_name,
    scientific_name: plant.scientific_name,
    common_name: plant.common_name,
    local_name: plant.local_name,
    conservation_status: plant.conservation_status,
    health_status: plant.health_status,
    image_path: plant.photos[0]?.storage_path ?? null,
  };
}

async function eachPage<T>(table: string, columns: string, order: string) {
  const pageSize = 500;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select(columns).order(order).range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function textField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

export type ApprovedPlant = {
  plant_id: string;
  qr_code: string;
  plant_name: string | null;
  scientific_name: string | null;
  common_name: string | null;
  local_name: string | null;
  location_name: string | null;
  recorded_by: string | null;
  recorded_at: string | null;
};

export type ApprovedPlantDetail = PublicPlantDetail & {
  plant_id: string;
  latitude: number | null;
  longitude: number | null;
  recorded_by: string | null;
  recorded_at: string | null;
};

export async function listApprovedPlants() {
  const { data, error } = await supabase
    .from("public_plant_pages")
    .select("plant_id, qr_code, plant_name, scientific_name, common_name, local_name, location_name, recorded_by, recorded_at")
    .order("recorded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ApprovedPlant[]).filter((plant) => plant.plant_id);
}

export async function loadApprovedPlant(plantId: string): Promise<ApprovedPlantDetail | null> {
  const page = await supabase.from("public_plant_pages").select("*").eq("plant_id", plantId).maybeSingle();
  if (page.error) throw new Error(page.error.message);
  if (!page.data) return null;

  const row = page.data as Record<string, unknown>;
  const code = textField(row, "qr_code") ?? "";
  const photos = code
    ? await supabase.from("public_plant_photos").select("storage_path, caption").eq("qr_code", code)
    : { error: null, data: [] as PublicPlantPhoto[] };
  const visible = photos.error
    ? []
    : ((photos.data ?? []) as PublicPlantPhoto[]).filter(
        (photo) => photo.storage_path && isDisplayablePhoto(photo.storage_path),
      );

  return {
    plant_id: textField(row, "plant_id") ?? plantId,
    qr_code: code,
    plant_name: textField(row, "plant_name"),
    scientific_name: textField(row, "scientific_name"),
    common_name: textField(row, "common_name"),
    local_name: textField(row, "local_name"),
    conservation_status: textField(row, "conservation_status"),
    health_status: textField(row, "health_status"),
    family: textField(row, "family"),
    genus: textField(row, "genus"),
    description: textField(row, "description"),
    distribution: textField(row, "distribution"),
    ecological_info: textField(row, "ecological_info"),
    cultural_significance: textField(row, "cultural_significance"),
    location_name: textField(row, "location_name"),
    height_m: numberField(row, "height_m"),
    life_stage: textField(row, "life_stage"),
    image_path: visible[0]?.storage_path ?? null,
    photos: visible,
    latitude: numberField(row, "latitude"),
    longitude: numberField(row, "longitude"),
    recorded_by: textField(row, "recorded_by"),
    recorded_at: textField(row, "recorded_at"),
  };
}

function numberField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "number" ? value : null;
}

export function plantTitle(plant: Pick<PublicPlantCard, "plant_name" | "scientific_name">) {
  return plant.plant_name || plant.scientific_name || "Unidentified plant";
}

export function plantSubtitle(plant: Pick<PublicPlantCard, "plant_name" | "scientific_name" | "common_name" | "local_name">) {
  return [plant.plant_name ? plant.scientific_name : null, plant.common_name, plant.local_name].filter(Boolean).join(" · ");
}
