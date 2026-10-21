"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { choiceFromForm } from "@/lib/field-choices";
import { numberOrNull, textOrNull } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { PHOTO_TOO_LARGE, PHOTO_WRONG_TYPE, uploadPlantPhoto } from "@/lib/photos";
import { resolveSpeciesId } from "@/lib/species";

export async function createRecord(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const status = String(formData.get("status") || "draft");
  if (!textOrNull(formData.get("plant_name"))) {
    redirect(`/botanist/new?error=${encodeURIComponent("Enter a plant name.")}`);
  }

  const species = await speciesFromForm(supabase, user.id, formData);
  if (species.error) {
    redirect(`/botanist/new?error=${encodeURIComponent(species.error)}`);
  }

  const { data, error } = await supabase
    .from("plant_records")
    .insert({
      botanist_id: user.id,
      plant_name: textOrNull(formData.get("plant_name")),
      life_stage: choiceFromForm(formData, "life_stage"),
      species_id: species.id,
      height_m: numberOrNull(formData.get("height_m")),
      trunk_diameter_cm: numberOrNull(formData.get("trunk_diameter_cm")),
      leaf_traits: choiceFromForm(formData, "leaf_traits"),
      flower_fruit_traits: choiceFromForm(formData, "flower_fruit_traits"),
      health_status: choiceFromForm(formData, "health_status"),
      other_traits: textOrNull(formData.get("other_traits")),
      location_name: textOrNull(formData.get("location_name")),
      latitude: numberOrNull(formData.get("latitude")),
      longitude: numberOrNull(formData.get("longitude")),
      status: status === "submitted" ? "submitted" : "draft",
      sync_status: "synced",
    })
    .select("uuid")
    .single();

  if (error || !data) {
    redirect(`/botanist/new?error=${encodeURIComponent(error?.message ?? "Could not save")}`);
  }

  const photoError = await saveRecordPhoto(supabase, user.id, data.uuid, formData);
  if (photoError) {
    redirect(`/botanist?error=${encodeURIComponent(photoError)}`);
  }

  redirect("/botanist");
}

export async function addRecordPhoto(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const id = String(formData.get("id"));
  const { data: record } = await supabase
    .from("plant_records")
    .select("status")
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .maybeSingle();

  if (!record || !["draft", "submitted", "needs_revision", "rejected"].includes(record.status)) {
    redirect(`/botanist/${id}?error=${encodeURIComponent("A photo can be added only before the record is approved.")}`);
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    redirect(`/botanist/${id}?error=${encodeURIComponent("Choose a photo first.")}`);
  }

  const photoError = await saveRecordPhoto(supabase, user.id, id, formData);
  if (photoError) {
    redirect(`/botanist/${id}?error=${encodeURIComponent(photoError)}`);
  }
  redirect(`/botanist/${id}`);
}

export async function generateQr(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const id = String(formData.get("id"));
  const { data: record } = await supabase
    .from("plant_records")
    .select("status, qr_code")
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .maybeSingle();

  if (!record) {
    redirect(`/botanist/${id}?error=${encodeURIComponent("This record was not found.")}`);
  }
  if (record.status !== "approved") {
    redirect(`/botanist/${id}?error=${encodeURIComponent("A QR code can be created only after the record is approved.")}`);
  }
  if (record.qr_code) {
    redirect(`/botanist/${id}`);
  }

  const qrCode = `plant-${id.slice(0, 8)}`;
  const { error } = await supabase
    .from("plant_records")
    .update({ qr_code: qrCode })
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .eq("status", "approved");
  if (error) {
    redirect(`/botanist/${id}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/botanist/${id}`);
}

export async function resubmit(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const id = String(formData.get("id"));
  const { data: existing } = await supabase
    .from("plant_records")
    .select("status")
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .maybeSingle();

  if (!existing || !["draft", "needs_revision", "rejected"].includes(existing.status)) {
    redirect(`/botanist/${id}?error=${encodeURIComponent("This record can no longer be edited.")}`);
  }
  if (!textOrNull(formData.get("plant_name"))) {
    redirect(`/botanist/${id}?error=${encodeURIComponent("Enter a plant name.")}`);
  }

  const species = await speciesFromForm(supabase, user.id, formData);
  if (species.error) {
    redirect(`/botanist/${id}?error=${encodeURIComponent(species.error)}`);
  }

  const { error } = await supabase
    .from("plant_records")
    .update({
      plant_name: textOrNull(formData.get("plant_name")),
      life_stage: choiceFromForm(formData, "life_stage"),
      species_id: species.id,
      height_m: numberOrNull(formData.get("height_m")),
      trunk_diameter_cm: numberOrNull(formData.get("trunk_diameter_cm")),
      leaf_traits: choiceFromForm(formData, "leaf_traits"),
      flower_fruit_traits: choiceFromForm(formData, "flower_fruit_traits"),
      health_status: choiceFromForm(formData, "health_status"),
      other_traits: textOrNull(formData.get("other_traits")),
      location_name: textOrNull(formData.get("location_name")),
      latitude: numberOrNull(formData.get("latitude")),
      longitude: numberOrNull(formData.get("longitude")),
      status: "submitted",
    })
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .in("status", ["draft", "needs_revision", "rejected"]);

  if (error) {
    redirect(`/botanist/${id}?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/botanist");
}

async function saveRecordPhoto(
  supabase: Parameters<typeof uploadPlantPhoto>[0] & {
    from: (table: "plant_photos") => {
      insert: (row: {
        plant_record_id: string;
        storage_path: string;
        caption: string | null;
        uploaded_by: string;
      }) => PromiseLike<{ error: { message: string } | null }>;
    };
  },
  userId: string,
  recordId: string,
  formData: FormData,
) {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;

  const uploaded = await uploadPlantPhoto(supabase, userId, photo);
  if (uploaded.error || !uploaded.path) return translatePhotoError(uploaded.error);

  const { error } = await supabase.from("plant_photos").insert({
    plant_record_id: recordId,
    storage_path: uploaded.path,
    caption: textOrNull(formData.get("photo_caption")),
    uploaded_by: userId,
  });
  return error?.message ?? null;
}

export async function ensureSpecies(name: string) {
  const { supabase, user } = await requireUser(["botanist"]);
  const resolved = await resolveSpeciesId(supabase, user.id, "new", name);
  if (!resolved.error) return { id: resolved.id, error: null as string | null };
  if (resolved.error === "name") {
    const { t } = await getCopy();
    return { id: null, error: t.newSpeciesRequired };
  }
  return { id: null, error: resolved.error };
}

async function speciesFromForm(
  supabase: Parameters<typeof resolveSpeciesId>[0],
  userId: string,
  formData: FormData,
) {
  const resolved = await resolveSpeciesId(
    supabase,
    userId,
    textOrNull(formData.get("species_id")),
    textOrNull(formData.get("new_species_name")),
  );
  if (!resolved.error) return resolved;
  if (resolved.error === "name") {
    const { t } = await getCopy();
    return { id: null, error: t.newSpeciesRequired };
  }
  return resolved;
}

async function translatePhotoError(message: string | null) {
  if (!message) return "Could not upload the photo.";
  const { t } = await getCopy();
  if (message === PHOTO_TOO_LARGE) return t.photoTooLarge;
  if (message === PHOTO_WRONG_TYPE) return t.photoType;
  return message;
}
