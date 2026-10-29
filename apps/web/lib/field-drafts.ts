import { createBrowserSupabase } from "@/lib/supabase/browser";
import { ensureSpecies } from "@/app/botanist/actions";
import { choiceFromForm } from "@/lib/field-choices";
import { numberOrNull, textOrNull } from "@/lib/format";
import { photoProblemMessage, uploadPlantPhoto } from "@/lib/photos";

export type CachedSpecies = {
  uuid: string;
  id: string;
  scientific_name: string;
  common_name: string | null;
};

export type FieldDraft = {
  localId: string;
  plantName: string;
  lifeStage: string;
  speciesId: string | null;
  speciesLabel: string;
  newSpeciesName?: string;
  heightM: string;
  trunkDiameterCm: string;
  latitude: string;
  longitude: string;
  locationName: string;
  leafTraits: string;
  flowerFruitTraits: string;
  healthStatus: string;
  otherTraits: string;
  photoUrl: string;
  photoCaption: string;
  photoName?: string;
  photoType?: string;
  photoBlob?: Blob;
  status: "draft" | "submitted";
  savedAt: string;
};

const DB_NAME = "plant-field";
const DB_VERSION = 1;

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("species")) db.createObjectStore("species");
      if (!db.objectStoreNames.contains("drafts")) db.createObjectStore("drafts", { keyPath: "localId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheSpecies(species: CachedSpecies[]) {
  const db = await openDb();
  const tx = db.transaction("species", "readwrite");
  tx.objectStore("species").put(species, "list");
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadCachedSpecies() {
  const db = await openDb();
  const species = await requestToPromise(
    db.transaction("species").objectStore("species").get("list"),
  );
  db.close();
  return (species as CachedSpecies[] | undefined) ?? [];
}

export async function saveDraft(draft: FieldDraft) {
  const db = await openDb();
  const tx = db.transaction("drafts", "readwrite");
  tx.objectStore("drafts").put(draft);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listDrafts() {
  const db = await openDb();
  const drafts = await requestToPromise(db.transaction("drafts").objectStore("drafts").getAll());
  db.close();
  return (drafts as FieldDraft[]).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function deleteDraft(localId: string) {
  const db = await openDb();
  const tx = db.transaction("drafts", "readwrite");
  tx.objectStore("drafts").delete(localId);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function draftFromForm(formData: FormData, species: CachedSpecies[]): FieldDraft {
  const speciesId = textOrNull(formData.get("species_id"));
  const newSpeciesName = String(formData.get("new_species_name") || "").trim();
  const match = species.find((item) => item.uuid === speciesId);
  const status = String(formData.get("status") || "draft") === "submitted" ? "submitted" : "draft";
  return {
    localId: crypto.randomUUID(),
    plantName: String(formData.get("plant_name") || ""),
    lifeStage: choiceFromForm(formData, "life_stage") ?? "",
    speciesId,
    speciesLabel: speciesId === "new" ? newSpeciesName : match ? `${match.id} · ${match.scientific_name}` : "",
    newSpeciesName: speciesId === "new" ? newSpeciesName : "",
    heightM: String(formData.get("height_m") || ""),
    trunkDiameterCm: String(formData.get("trunk_diameter_cm") || ""),
    latitude: String(formData.get("latitude") || ""),
    longitude: String(formData.get("longitude") || ""),
    locationName: String(formData.get("location_name") || ""),
    leafTraits: choiceFromForm(formData, "leaf_traits") ?? "",
    flowerFruitTraits: choiceFromForm(formData, "flower_fruit_traits") ?? "",
    healthStatus: choiceFromForm(formData, "health_status") ?? "",
    otherTraits: String(formData.get("other_traits") || ""),
    photoUrl: "",
    photoCaption: String(formData.get("photo_caption") || ""),
    status,
    savedAt: new Date().toISOString(),
  };
}

export async function syncDrafts() {
  const supabase = createBrowserSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { uploaded: 0, error: "Sign in before uploading." };

  const drafts = await listDrafts();
  let uploaded = 0;
  for (const draft of drafts) {
    let speciesId = draft.speciesId;
    if (speciesId === "new") {
      const created = await ensureSpecies(draft.newSpeciesName || "");
      if (created.error || !created.id) return { uploaded, error: created.error ?? "Enter the new species name." };
      speciesId = created.id;
    }

    const { data, error } = await supabase
      .from("plant_records")
      .insert({
        botanist_id: user.id,
        local_id: draft.localId,
        plant_name: textOrNull(draft.plantName),
        life_stage: textOrNull(draft.lifeStage),
        species_id: speciesId,
        height_m: numberOrNull(draft.heightM),
        trunk_diameter_cm: numberOrNull(draft.trunkDiameterCm),
        leaf_traits: textOrNull(draft.leafTraits),
        flower_fruit_traits: textOrNull(draft.flowerFruitTraits),
        health_status: textOrNull(draft.healthStatus),
        other_traits: textOrNull(draft.otherTraits),
        location_name: textOrNull(draft.locationName),
        latitude: numberOrNull(draft.latitude),
        longitude: numberOrNull(draft.longitude),
        status: draft.status,
        sync_status: "synced",
      })
      .select("uuid")
      .single();

    if (error) {
      if (error.code === "23505") {
        await deleteDraft(draft.localId);
        uploaded += 1;
        continue;
      }
      return { uploaded, error: error.message };
    }

    let storagePath = textOrNull(draft.photoUrl);
    if (draft.photoBlob && draft.photoBlob.size > 0 && data) {
      const file = new File([draft.photoBlob], draft.photoName || "plant-photo.jpg", {
        type: draft.photoType || draft.photoBlob.type || "image/jpeg",
      });
      const problem = photoProblemMessage(file);
      if (problem) return { uploaded, error: problem };
      const uploadedPhoto = await uploadPlantPhoto(supabase, user.id, file);
      if (uploadedPhoto.error || !uploadedPhoto.path) {
        return { uploaded, error: uploadedPhoto.error ?? "Could not upload the photo." };
      }
      storagePath = uploadedPhoto.path;
    }
    if (storagePath && data) {
      await supabase.from("plant_photos").insert({
        plant_record_id: data.uuid,
        storage_path: storagePath,
        caption: textOrNull(draft.photoCaption),
        uploaded_by: user.id,
      });
    }
    await deleteDraft(draft.localId);
    uploaded += 1;
  }
  return { uploaded, error: null as string | null };
}
