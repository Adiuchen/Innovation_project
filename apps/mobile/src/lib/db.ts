import * as SQLite from "expo-sqlite";
import type { CachedRecord, Draft, LocalPhoto, PhotoRef, Species } from "@/types";

export type StoredPublicPlant = {
  qr_code: string;
  plant_name: string | null;
  scientific_name: string | null;
  common_name: string | null;
  local_name: string | null;
  family: string | null;
  genus: string | null;
  description: string | null;
  distribution: string | null;
  ecological_info: string | null;
  cultural_significance: string | null;
  conservation_status: string | null;
  health_status: string | null;
  location_name: string | null;
  life_stage: string | null;
  height_m: number | null;
  photos: PhotoRef[];
};

export type PublicCatalogStatus = {
  savedAt: string;
  plantCount: number;
};

type SpeciesRow = Omit<Species, "photos"> & { photos_json: string | null };
type RecordRow = Omit<CachedRecord, "photos"> & { photos_json: string | null };

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function parsePhotos(value: string | null): PhotoRef[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as PhotoRef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function tableColumns(db: SQLite.SQLiteDatabase, table: string) {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((row) => row.name));
}

async function ensureColumn(db: SQLite.SQLiteDatabase, table: string, column: string, typeSql: string) {
  const columns = await tableColumns(db, table);
  if (columns.has(column)) return;
  await db.runAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeSql}`);
  const after = await tableColumns(db, table);
  if (!after.has(column)) {
    throw new Error(`Could not add ${table}.${column} to the phone database.`);
  }
}

async function migrateSchema(db: SQLite.SQLiteDatabase) {
  // Do not put indexes on late-added columns in the CREATE batch — existing phones already
  // have drafts without qr_code, and a failed CREATE INDEX aborts the whole batch.
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS species (
      uuid TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      common_name TEXT,
      local_name TEXT,
      family TEXT,
      genus TEXT,
      description TEXT,
      conservation_status TEXT,
      distribution TEXT,
      ecological_info TEXT,
      cultural_significance TEXT,
      photos_json TEXT
    );
    CREATE TABLE IF NOT EXISTS drafts (
      local_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      remote_uuid TEXT,
      species_id TEXT,
      species_label TEXT,
      plant_name TEXT,
      life_stage TEXT,
      height_m TEXT,
      trunk_diameter_cm TEXT,
      latitude TEXT,
      longitude TEXT,
      location_name TEXT,
      leaf_traits TEXT,
      flower_fruit_traits TEXT,
      health_status TEXT,
      other_traits TEXT,
      photo_uri TEXT,
      photo_caption TEXT,
      photo_remote_url TEXT,
      qr_code TEXT,
      status TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      sync_error TEXT
    );
    CREATE INDEX IF NOT EXISTS drafts_user ON drafts(user_id);
    CREATE TABLE IF NOT EXISTS records (
      uuid TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      code TEXT,
      species_id TEXT,
      species_name TEXT,
      common_name TEXT,
      plant_name TEXT,
      life_stage TEXT,
      status TEXT,
      location_name TEXT,
      latitude REAL,
      longitude REAL,
      height_m REAL,
      trunk_diameter_cm REAL,
      leaf_traits TEXT,
      flower_fruit_traits TEXT,
      health_status TEXT,
      other_traits TEXT,
      qr_code TEXT,
      review_note TEXT,
      recorded_at TEXT,
      photos_json TEXT
    );
    CREATE INDEX IF NOT EXISTS records_user ON records(user_id);
    CREATE TABLE IF NOT EXISTS public_plants (
      qr_code TEXT PRIMARY KEY NOT NULL,
      plant_name TEXT,
      scientific_name TEXT,
      common_name TEXT,
      local_name TEXT,
      family TEXT,
      genus TEXT,
      description TEXT,
      distribution TEXT,
      ecological_info TEXT,
      cultural_significance TEXT,
      conservation_status TEXT,
      health_status TEXT,
      location_name TEXT,
      life_stage TEXT,
      height_m REAL,
      photos_json TEXT
    );
    CREATE TABLE IF NOT EXISTS public_catalog (
      id TEXT PRIMARY KEY NOT NULL,
      saved_at TEXT NOT NULL,
      plant_count INTEGER NOT NULL
    );
  `);

  await ensureColumn(db, "drafts", "plant_name", "TEXT");
  await ensureColumn(db, "drafts", "life_stage", "TEXT");
  await ensureColumn(db, "drafts", "photos_json", "TEXT");
  await ensureColumn(db, "drafts", "qr_code", "TEXT");
  await ensureColumn(db, "drafts", "visibility", "TEXT");
  await ensureColumn(db, "records", "visibility", "TEXT");
  await ensureColumn(db, "records", "plant_name", "TEXT");
  await ensureColumn(db, "records", "life_stage", "TEXT");
  await ensureColumn(db, "records", "qr_code", "TEXT");

  // Indexes that depend on migrated columns — create only after ensureColumn.
  for (const statement of [
    "CREATE INDEX IF NOT EXISTS drafts_qr ON drafts(qr_code)",
    "CREATE INDEX IF NOT EXISTS records_qr ON records(qr_code)",
  ]) {
    try {
      await db.execAsync(statement);
    } catch {
      // Index may already exist.
    }
  }
}

async function database() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("plant-field.db")
      .then(async (db) => {
        await migrateSchema(db);
        return db;
      })
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
}

export async function initDb() {
  await database();
}

function toSpecies(row: SpeciesRow): Species {
  const { photos_json, ...rest } = row;
  return { ...rest, photos: parsePhotos(photos_json) };
}

function toRecord(row: RecordRow): CachedRecord {
  const { photos_json, visibility, ...rest } = row;
  return {
    ...rest,
    visibility: visibility === "rare" ? "rare" : "ordinary",
    photos: parsePhotos(photos_json),
  };
}

export async function replaceSpecies(species: Species[]) {
  const db = await database();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM species");
    for (const item of species) {
      await db.runAsync(
        `INSERT INTO species (
          uuid, code, scientific_name, common_name, local_name, family, genus, description,
          conservation_status, distribution, ecological_info, cultural_significance, photos_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.uuid,
        item.code,
        item.scientific_name,
        item.common_name,
        item.local_name,
        item.family,
        item.genus,
        item.description,
        item.conservation_status,
        item.distribution,
        item.ecological_info,
        item.cultural_significance,
        JSON.stringify(item.photos),
      );
    }
  });
}

export async function listSpecies() {
  const db = await database();
  const rows = await db.getAllAsync<SpeciesRow>("SELECT * FROM species ORDER BY scientific_name COLLATE NOCASE");
  return rows.map(toSpecies);
}

export async function getSpecies(uuid: string) {
  const db = await database();
  const row = await db.getFirstAsync<SpeciesRow>("SELECT * FROM species WHERE uuid = ?", uuid);
  return row ? toSpecies(row) : null;
}

type DraftRow = Omit<Draft, "plant_name" | "life_stage" | "photos" | "qr_code" | "visibility"> & {
  plant_name: string | null;
  life_stage: string | null;
  photos_json: string | null;
  qr_code: string | null;
  visibility: string | null;
};

function parseLocalPhotos(value: string | null): LocalPhoto[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as LocalPhoto[];
    return Array.isArray(parsed) ? parsed.filter((photo) => photo && typeof photo.uri === "string") : [];
  } catch {
    return [];
  }
}

function toDraft(row: DraftRow): Draft {
  const { photos_json, visibility, ...rest } = row;
  let photos = parseLocalPhotos(photos_json);
  // Drafts saved before multiple photos were supported keep their single photo.
  if (photos.length === 0 && rest.photo_uri) {
    photos = [
      {
        id: rest.local_id,
        uri: rest.photo_uri,
        caption: rest.photo_caption ?? "",
        remote_url: rest.photo_remote_url,
      },
    ];
  }
  return {
    ...rest,
    plant_name: rest.plant_name ?? "",
    life_stage: rest.life_stage ?? "",
    qr_code: rest.qr_code ?? null,
    visibility: visibility === "rare" ? "rare" : "ordinary",
    photos,
  };
}

export async function saveDraft(draft: Draft) {
  const db = await database();
  // Hot reload can leave an old open handle; always confirm the column before write.
  await ensureColumn(db, "drafts", "qr_code", "TEXT");
  await ensureColumn(db, "drafts", "visibility", "TEXT");
  const photos: LocalPhoto[] =
    draft.photos ??
    (draft.photo_uri
      ? [{ id: draft.local_id, uri: draft.photo_uri, caption: draft.photo_caption ?? "", remote_url: draft.photo_remote_url }]
      : []);
  const first = photos[0];
  await db.runAsync(
    `INSERT INTO drafts (
      local_id, user_id, remote_uuid, species_id, species_label, plant_name, life_stage, height_m, trunk_diameter_cm,
      latitude, longitude, location_name, leaf_traits, flower_fruit_traits, health_status,
      other_traits, photo_uri, photo_caption, photo_remote_url, qr_code, visibility, status, saved_at, sync_error, photos_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(local_id) DO UPDATE SET
      user_id = excluded.user_id,
      remote_uuid = excluded.remote_uuid,
      species_id = excluded.species_id,
      species_label = excluded.species_label,
      plant_name = excluded.plant_name,
      life_stage = excluded.life_stage,
      height_m = excluded.height_m,
      trunk_diameter_cm = excluded.trunk_diameter_cm,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      location_name = excluded.location_name,
      leaf_traits = excluded.leaf_traits,
      flower_fruit_traits = excluded.flower_fruit_traits,
      health_status = excluded.health_status,
      other_traits = excluded.other_traits,
      photo_uri = excluded.photo_uri,
      photo_caption = excluded.photo_caption,
      photo_remote_url = excluded.photo_remote_url,
      qr_code = excluded.qr_code,
      visibility = excluded.visibility,
      status = excluded.status,
      saved_at = excluded.saved_at,
      sync_error = excluded.sync_error,
      photos_json = excluded.photos_json`,
    draft.local_id,
    draft.user_id,
    draft.remote_uuid,
    draft.species_id,
    draft.species_label,
    draft.plant_name,
    draft.life_stage,
    draft.height_m,
    draft.trunk_diameter_cm,
    draft.latitude,
    draft.longitude,
    draft.location_name,
    draft.leaf_traits,
    draft.flower_fruit_traits,
    draft.health_status,
    draft.other_traits,
    first?.uri ?? null,
    first?.caption ?? "",
    first?.remote_url ?? null,
    draft.qr_code,
    draft.visibility === "rare" ? "rare" : "ordinary",
    draft.status,
    draft.saved_at,
    draft.sync_error,
    JSON.stringify(photos),
  );
}

export async function listDrafts(userId: string) {
  const db = await database();
  const rows = await db.getAllAsync<DraftRow>(
    "SELECT * FROM drafts WHERE user_id = ? ORDER BY saved_at DESC",
    userId,
  );
  return rows.map(toDraft);
}

export async function getDraft(localId: string) {
  const db = await database();
  const row = await db.getFirstAsync<DraftRow>("SELECT * FROM drafts WHERE local_id = ?", localId);
  return row ? toDraft(row) : null;
}

export async function getDraftByQr(code: string) {
  const db = await database();
  const row = await db.getFirstAsync<DraftRow>("SELECT * FROM drafts WHERE qr_code = ?", code);
  return row ? toDraft(row) : null;
}

export async function deleteDraft(localId: string) {
  const db = await database();
  await db.runAsync("DELETE FROM drafts WHERE local_id = ?", localId);
}

export async function countDrafts(userId: string) {
  const db = await database();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM drafts WHERE user_id = ?",
    userId,
  );
  return row?.count ?? 0;
}

export async function replaceRecords(userId: string, records: CachedRecord[]) {
  const db = await database();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM records WHERE user_id = ?", userId);
    for (const item of records) {
      await db.runAsync(
        `INSERT INTO records (
          uuid, user_id, code, species_id, species_name, common_name, plant_name, life_stage, status, location_name,
          latitude, longitude, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits,
          health_status, other_traits, qr_code, visibility, review_note, recorded_at, photos_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.uuid,
        item.user_id,
        item.code,
        item.species_id,
        item.species_name,
        item.common_name,
        item.plant_name,
        item.life_stage,
        item.status,
        item.location_name,
        item.latitude,
        item.longitude,
        item.height_m,
        item.trunk_diameter_cm,
        item.leaf_traits,
        item.flower_fruit_traits,
        item.health_status,
        item.other_traits,
        item.qr_code,
        item.visibility === "rare" ? "rare" : "ordinary",
        item.review_note,
        item.recorded_at,
        JSON.stringify(item.photos),
      );
    }
  });
}

export async function listRecords(userId: string) {
  const db = await database();
  const rows = await db.getAllAsync<RecordRow>(
    "SELECT * FROM records WHERE user_id = ? ORDER BY recorded_at DESC",
    userId,
  );
  return rows.map(toRecord);
}

export async function getRecord(uuid: string) {
  const db = await database();
  const row = await db.getFirstAsync<RecordRow>("SELECT * FROM records WHERE uuid = ?", uuid);
  return row ? toRecord(row) : null;
}

/** Cache one field record (e.g. after a staff QR scan) without wiping the botanist's list. */
export async function upsertCachedRecord(item: CachedRecord) {
  const db = await database();
  await ensureColumn(db, "records", "visibility", "TEXT");
  await db.runAsync(
    `INSERT INTO records (
      uuid, user_id, code, species_id, species_name, common_name, plant_name, life_stage, status, location_name,
      latitude, longitude, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits,
      health_status, other_traits, qr_code, visibility, review_note, recorded_at, photos_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uuid) DO UPDATE SET
      user_id = excluded.user_id,
      code = excluded.code,
      species_id = excluded.species_id,
      species_name = excluded.species_name,
      common_name = excluded.common_name,
      plant_name = excluded.plant_name,
      life_stage = excluded.life_stage,
      status = excluded.status,
      location_name = excluded.location_name,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      height_m = excluded.height_m,
      trunk_diameter_cm = excluded.trunk_diameter_cm,
      leaf_traits = excluded.leaf_traits,
      flower_fruit_traits = excluded.flower_fruit_traits,
      health_status = excluded.health_status,
      other_traits = excluded.other_traits,
      qr_code = excluded.qr_code,
      visibility = excluded.visibility,
      review_note = excluded.review_note,
      recorded_at = excluded.recorded_at,
      photos_json = excluded.photos_json`,
    item.uuid,
    item.user_id,
    item.code,
    item.species_id,
    item.species_name,
    item.common_name,
    item.plant_name,
    item.life_stage,
    item.status,
    item.location_name,
    item.latitude,
    item.longitude,
    item.height_m,
    item.trunk_diameter_cm,
    item.leaf_traits,
    item.flower_fruit_traits,
    item.health_status,
    item.other_traits,
    item.qr_code,
    item.visibility === "rare" ? "rare" : "ordinary",
    item.review_note,
    item.recorded_at,
    JSON.stringify(item.photos),
  );
}

export async function getRecordByQr(code: string) {
  const db = await database();
  const row = await db.getFirstAsync<RecordRow>("SELECT * FROM records WHERE qr_code = ?", code);
  return row ? toRecord(row) : null;
}

type PublicPlantRow = Omit<StoredPublicPlant, "photos"> & { photos_json: string | null };

function toStoredPublicPlant(row: PublicPlantRow): StoredPublicPlant {
  const { photos_json, ...rest } = row;
  return { ...rest, photos: parsePhotos(photos_json) };
}

async function writePublicPlant(db: SQLite.SQLiteDatabase, item: StoredPublicPlant) {
  await db.runAsync(
    `INSERT INTO public_plants (
      qr_code, plant_name, scientific_name, common_name, local_name, family, genus, description,
      distribution, ecological_info, cultural_significance, conservation_status, health_status,
      location_name, life_stage, height_m, photos_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(qr_code) DO UPDATE SET
      plant_name = excluded.plant_name,
      scientific_name = excluded.scientific_name,
      common_name = excluded.common_name,
      local_name = excluded.local_name,
      family = excluded.family,
      genus = excluded.genus,
      description = excluded.description,
      distribution = excluded.distribution,
      ecological_info = excluded.ecological_info,
      cultural_significance = excluded.cultural_significance,
      conservation_status = excluded.conservation_status,
      health_status = excluded.health_status,
      location_name = excluded.location_name,
      life_stage = excluded.life_stage,
      height_m = excluded.height_m,
      photos_json = excluded.photos_json`,
    item.qr_code,
    item.plant_name,
    item.scientific_name,
    item.common_name,
    item.local_name,
    item.family,
    item.genus,
    item.description,
    item.distribution,
    item.ecological_info,
    item.cultural_significance,
    item.conservation_status,
    item.health_status,
    item.location_name,
    item.life_stage,
    item.height_m,
    JSON.stringify(item.photos),
  );
}

export async function replaceCachedPublicPlants(plants: StoredPublicPlant[], savedAt: string) {
  const db = await database();
  const seen = new Set<string>();
  const unique = plants.filter((plant) => {
    if (!plant.qr_code || seen.has(plant.qr_code)) return false;
    seen.add(plant.qr_code);
    return true;
  });
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM public_plants");
    for (const item of unique) await writePublicPlant(db, item);
    await db.runAsync(
      `INSERT INTO public_catalog (id, saved_at, plant_count) VALUES ('published', ?, ?)
       ON CONFLICT(id) DO UPDATE SET saved_at = excluded.saved_at, plant_count = excluded.plant_count`,
      savedAt,
      unique.length,
    );
  });
}

export async function upsertCachedPublicPlant(plant: StoredPublicPlant) {
  const db = await database();
  await writePublicPlant(db, plant);
}

export async function deleteCachedPublicPlant(code: string) {
  const db = await database();
  await db.runAsync("DELETE FROM public_plants WHERE qr_code = ?", code);
  await db.runAsync(
    `UPDATE public_catalog
     SET plant_count = (SELECT COUNT(*) FROM public_plants)
     WHERE id = 'published'`,
  );
}

export async function getCachedPublicPlant(code: string) {
  const db = await database();
  const row = await db.getFirstAsync<PublicPlantRow>("SELECT * FROM public_plants WHERE qr_code = ?", code);
  return row ? toStoredPublicPlant(row) : null;
}

export async function searchCachedPublicPlants(query: string) {
  const db = await database();
  const needle = query.trim().replace(/[%_]/g, "");
  if (!needle) {
    const rows = await db.getAllAsync<PublicPlantRow>(
      "SELECT * FROM public_plants ORDER BY COALESCE(plant_name, scientific_name) COLLATE NOCASE LIMIT 50",
    );
    return rows.map(toStoredPublicPlant);
  }
  const like = `%${needle}%`;
  const rows = await db.getAllAsync<PublicPlantRow>(
    `SELECT * FROM public_plants
     WHERE plant_name LIKE ? COLLATE NOCASE
        OR scientific_name LIKE ? COLLATE NOCASE
        OR common_name LIKE ? COLLATE NOCASE
        OR local_name LIKE ? COLLATE NOCASE
     ORDER BY COALESCE(plant_name, scientific_name) COLLATE NOCASE
     LIMIT 50`,
    like,
    like,
    like,
    like,
  );
  return rows.map(toStoredPublicPlant);
}

export async function publicCatalogStatus() {
  const db = await database();
  const row = await db.getFirstAsync<{ saved_at: string; plant_count: number }>(
    "SELECT saved_at, plant_count FROM public_catalog WHERE id = 'published'",
  );
  if (!row) return null;
  return { savedAt: row.saved_at, plantCount: row.plant_count } satisfies PublicCatalogStatus;
}
