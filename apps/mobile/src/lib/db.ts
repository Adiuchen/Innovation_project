import * as SQLite from "expo-sqlite";
import type { CachedRecord, Draft, PhotoRef, Species } from "@/types";

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

async function database() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("plant-field.db").then(async (db) => {
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
        CREATE INDEX IF NOT EXISTS records_qr ON records(qr_code);
      `);
      for (const statement of [
        "ALTER TABLE drafts ADD COLUMN plant_name TEXT",
        "ALTER TABLE drafts ADD COLUMN life_stage TEXT",
        "ALTER TABLE records ADD COLUMN plant_name TEXT",
        "ALTER TABLE records ADD COLUMN life_stage TEXT",
      ]) {
        try {
          await db.execAsync(statement);
        } catch {
          // This phone already has the column.
        }
      }
      return db;
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
  const { photos_json, ...rest } = row;
  return { ...rest, photos: parsePhotos(photos_json) };
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

type DraftRow = Omit<Draft, "plant_name" | "life_stage"> & {
  plant_name: string | null;
  life_stage: string | null;
};

function toDraft(row: DraftRow): Draft {
  return {
    ...row,
    plant_name: row.plant_name ?? "",
    life_stage: row.life_stage ?? "",
  };
}

export async function saveDraft(draft: Draft) {
  const db = await database();
  await db.runAsync(
    `INSERT INTO drafts (
      local_id, user_id, remote_uuid, species_id, species_label, plant_name, life_stage, height_m, trunk_diameter_cm,
      latitude, longitude, location_name, leaf_traits, flower_fruit_traits, health_status,
      other_traits, photo_uri, photo_caption, photo_remote_url, status, saved_at, sync_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      status = excluded.status,
      saved_at = excluded.saved_at,
      sync_error = excluded.sync_error`,
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
    draft.photo_uri,
    draft.photo_caption,
    draft.photo_remote_url,
    draft.status,
    draft.saved_at,
    draft.sync_error,
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
          health_status, other_traits, qr_code, review_note, recorded_at, photos_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

export async function getRecordByQr(code: string) {
  const db = await database();
  const row = await db.getFirstAsync<RecordRow>("SELECT * FROM records WHERE qr_code = ?", code);
  return row ? toRecord(row) : null;
}
