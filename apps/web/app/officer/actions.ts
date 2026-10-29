"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { textOrNull } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { PHOTO_TOO_LARGE, PHOTO_WRONG_TYPE, uploadPlantPhoto } from "@/lib/photos";

const REVIEW_STATUSES = ["approved", "needs_revision", "rejected"] as const;

function officerReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "").trim();
  if (path !== "/officer" && !path.startsWith("/officer?") && !path.startsWith("/officer/records/")) {
    return "/officer";
  }
  if (path.includes("://") || path.includes("\\") || path.includes("\n") || path.includes("\r")) {
    return "/officer";
  }
  return path;
}

export async function reviewRecord(formData: FormData) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const destination = officerReturnPath(formData.get("next"));
  if (!REVIEW_STATUSES.includes(status as (typeof REVIEW_STATUSES)[number])) {
    const joiner = destination.includes("?") ? "&" : "?";
    redirect(`${destination}${joiner}error=${encodeURIComponent("Choose approve, request changes, or reject.")}`);
  }

  const { data: record } = await supabase
    .from("plant_records")
    .select("status, qr_code")
    .eq("uuid", id)
    .maybeSingle();
  if (!record || (record.status !== "submitted" && record.status !== "needs_revision")) {
    const joiner = destination.includes("?") ? "&" : "?";
    redirect(`${destination}${joiner}error=${encodeURIComponent("This record is not waiting for review.")}`);
  }

  const { error } = await supabase
    .from("plant_records")
    .update({
      status,
      review_note: textOrNull(formData.get("review_note")),
      qr_code: status === "approved" && !record.qr_code ? `plant-${id.slice(0, 8)}` : record.qr_code,
    })
    .eq("uuid", id)
    .in("status", ["submitted", "needs_revision"]);

  if (error) {
    const joiner = destination.includes("?") ? "&" : "?";
    redirect(`${destination}${joiner}error=${encodeURIComponent(error.message)}`);
  }
  redirect(destination);
}

function speciesPayload(formData: FormData) {
  return {
    scientific_name: String(formData.get("scientific_name") || "").trim(),
    common_name: textOrNull(formData.get("common_name")),
    local_name: textOrNull(formData.get("local_name")),
    family: textOrNull(formData.get("family")),
    genus: textOrNull(formData.get("genus")),
    description: textOrNull(formData.get("description")),
    conservation_status: textOrNull(formData.get("conservation_status")),
    distribution: textOrNull(formData.get("distribution")),
    ecological_info: textOrNull(formData.get("ecological_info")),
    cultural_significance: textOrNull(formData.get("cultural_significance")),
  };
}

export async function createSpecies(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const { data, error } = await supabase
    .from("species")
    .insert({ ...speciesPayload(formData), created_by: user.id })
    .select("uuid")
    .single();

  if (error || !data) {
    redirect(`/officer/species/new?error=${encodeURIComponent(error?.message ?? "Could not save")}`);
  }

  const photoError = await saveSpeciesPhoto(supabase, user.id, data.uuid, formData);
  if (photoError) {
    redirect(`/officer/species?error=${encodeURIComponent(photoError)}`);
  }
  redirect("/officer/species");
}

export async function updateSpecies(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const { error } = await supabase.from("species").update(speciesPayload(formData)).eq("uuid", id);
  if (error) redirect(`/officer/species/${id}?error=${encodeURIComponent(error.message)}`);

  const photoError = await saveSpeciesPhoto(supabase, user.id, id, formData);
  if (photoError) {
    redirect(`/officer/species?error=${encodeURIComponent(photoError)}`);
  }
  redirect("/officer/species");
}

function speciesReturnPath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value ?? "").trim();
  if (path === "/officer/species" || /^\/officer\/species\/[0-9a-f-]{36}$/i.test(path)) return path;
  return fallback;
}

async function saveSpeciesPhoto(
  supabase: Parameters<typeof uploadPlantPhoto>[0] & {
    from: (table: "plant_photos") => {
      insert: (row: {
        species_id: string;
        storage_path: string;
        caption: string | null;
        uploaded_by: string;
      }) => PromiseLike<{ error: { message: string } | null }>;
    };
  },
  userId: string,
  speciesId: string,
  formData: FormData,
) {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;

  const uploaded = await uploadPlantPhoto(supabase, userId, photo);
  if (uploaded.error || !uploaded.path) {
    if (!uploaded.error) return "Could not upload the photo.";
    const { t } = await getCopy();
    if (uploaded.error === PHOTO_TOO_LARGE) return t.photoTooLarge;
    if (uploaded.error === PHOTO_WRONG_TYPE) return t.photoType;
    return uploaded.error;
  }

  const { error } = await supabase.from("plant_photos").insert({
    species_id: speciesId,
    storage_path: uploaded.path,
    caption: textOrNull(formData.get("photo_caption")),
    uploaded_by: userId,
  });
  return error?.message ?? null;
}

export async function updateSpeciesPhoto(formData: FormData) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const speciesId = String(formData.get("species_id"));
  const { error } = await supabase
    .from("plant_photos")
    .update({ caption: textOrNull(formData.get("caption")) })
    .eq("id", id)
    .is("hidden_at", null);
  if (error) redirect(`/officer/species/${speciesId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/officer/species/${speciesId}`);
}

export async function hideSpeciesPhoto(formData: FormData) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const speciesId = String(formData.get("species_id"));
  const { error } = await supabase
    .from("plant_photos")
    .update({ hidden_at: new Date().toISOString() })
    .eq("id", id)
    .is("hidden_at", null);
  if (error) redirect(`/officer/species/${speciesId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/officer/species/${speciesId}`);
}

export async function deleteSpecies(formData: FormData) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("species")
    .update({ hidden_at: new Date().toISOString() })
    .eq("uuid", id)
    .is("hidden_at", null);
  if (error) {
    const destination = speciesReturnPath(formData.get("next"), `/officer/species/${id}`);
    const joiner = destination.includes("?") ? "&" : "?";
    redirect(`${destination}${joiner}error=${encodeURIComponent(error.message)}`);
  }
  redirect("/officer/species");
}
