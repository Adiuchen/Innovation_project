"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { PHOTO_TOO_LARGE, PHOTO_WRONG_TYPE } from "@/lib/photos";
import { attachPlantPhoto, draftFromUpdateForm, updateProblems, updateRowPayload, updatesSchemaMissing } from "@/lib/plant-update";

function backTo(updateId: string) {
  return `/botanist/updates/${encodeURIComponent(updateId)}`;
}

export async function saveBotanistPlantUpdate(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const updateId = String(formData.get("update_id") ?? "");
  const intent = String(formData.get("intent") ?? "draft");
  const { data: row, error } = await supabase
    .from("plant_updates")
    .select("uuid, plant_record_id, status")
    .eq("uuid", updateId)
    .eq("botanist_id", user.id)
    .eq("status", "open")
    .maybeSingle();
  if (updatesSchemaMissing(error)) redirect(`/botanist?error=${encodeURIComponent(t.updateSetup)}`);
  if (!row) redirect("/botanist");

  const back = backTo(updateId);
  if (intent === "submit") {
    const problem = updateProblems(formData);
    if (problem) redirect(`${back}?error=${encodeURIComponent(problem)}`);
  }

  const draft = draftFromUpdateForm(formData);
  const { error: updateError } = await supabase
    .from("plant_updates")
    .update({
      ...updateRowPayload(draft),
      status: intent === "submit" ? "submitted" : "open",
      submitted_at: intent === "submit" ? new Date().toISOString() : null,
    })
    .eq("uuid", updateId)
    .eq("botanist_id", user.id)
    .eq("status", "open");
  if (updateError) redirect(`${back}?error=${encodeURIComponent(updateError.message)}`);

  const photoError = await attachPlantPhoto(supabase, user.id, String(row.plant_record_id), formData, updateId);
  if (photoError) {
    redirect(`${back}?error=${encodeURIComponent(await photoMessage(photoError))}`);
  }
  if (intent === "submit") redirect("/botanist?updated=submitted");
  redirect(`${back}?updated=saved`);
}

export async function removePendingPhoto(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const updateId = String(formData.get("update_id") ?? "");
  const photoId = String(formData.get("photo_id") ?? "");
  const { data: row } = await supabase
    .from("plant_updates")
    .select("uuid, plant_record_id")
    .eq("uuid", updateId)
    .eq("botanist_id", user.id)
    .eq("status", "open")
    .maybeSingle();
  if (!row) redirect("/botanist");

  await supabase
    .from("plant_photos")
    .delete()
    .eq("id", photoId)
    .eq("pending_update_id", updateId)
    .eq("plant_record_id", row.plant_record_id);
  redirect(backTo(updateId));
}

async function photoMessage(message: string) {
  const { t } = await getCopy();
  if (message === PHOTO_TOO_LARGE) return t.photoTooLarge;
  if (message === PHOTO_WRONG_TYPE) return t.photoType;
  return message;
}
