"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import {
  applyPlantDraft,
  attachPlantPhoto,
  discardPendingPhotos,
  draftFromRow,
  draftFromUpdateForm,
  hideListedPhotos,
  loadApprovedPlant,
  publishPendingPhotos,
  updateProblems,
  updateRowPayload,
  updatesSchemaMissing,
} from "@/lib/plant-update";

function plantPath(plantId: string) {
  return `/officer/plants/${encodeURIComponent(plantId)}`;
}

function withMessage(path: string, key: string, value: string) {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}${key}=${encodeURIComponent(value)}`;
}

export async function saveOfficerPlantUpdate(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const plantId = String(formData.get("plant_id") ?? "").trim().toUpperCase();
  const plant = await loadApprovedPlant(supabase, plantId);
  const back = plant ? `${plantPath(plant.id)}/update` : "/officer/plants";
  if (!plant) redirect(withMessage("/officer/plants", "error", "This plant was not found."));

  const active = await supabase
    .from("plant_updates")
    .select("uuid")
    .eq("plant_record_id", plant.uuid)
    .in("status", ["open", "submitted"])
    .maybeSingle();
  if (updatesSchemaMissing(active.error)) redirect(withMessage(back, "error", t.updateSetup));
  if (active.error) redirect(withMessage(back, "error", active.error.message));
  if (active.data) redirect(withMessage(plantPath(plant.id), "error", t.updateInProgress));

  const problem = updateProblems(formData);
  if (problem) redirect(withMessage(back, "error", problem));

  const draft = draftFromUpdateForm(formData);
  const writeError = await applyPlantDraft(supabase, user.id, plant.uuid, draft);
  if (writeError) redirect(withMessage(back, "error", writeError));

  const hideError = await hideListedPhotos(supabase, plant.uuid, draft.hide_photo_ids);
  if (hideError) redirect(withMessage(plantPath(plant.id), "error", hideError));

  const photoError = await attachPlantPhoto(supabase, user.id, plant.uuid, formData, null);
  if (photoError) redirect(withMessage(plantPath(plant.id), "error", photoError));

  redirect(withMessage(plantPath(plant.id), "updated", "saved"));
}

export async function askBotanistToUpdate(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const plantId = String(formData.get("plant_id") ?? "").trim().toUpperCase();
  const plant = await loadApprovedPlant(supabase, plantId);
  if (!plant) redirect(withMessage("/officer/plants", "error", "This plant was not found."));
  const back = plantPath(plant.id);
  if (!plant.botanistId) redirect(withMessage(back, "error", t.noOriginalBotanist));

  const active = await supabase
    .from("plant_updates")
    .select("uuid")
    .eq("plant_record_id", plant.uuid)
    .in("status", ["open", "submitted"])
    .maybeSingle();
  if (updatesSchemaMissing(active.error)) redirect(withMessage(back, "error", t.updateSetup));
  if (active.error) redirect(withMessage(back, "error", active.error.message));
  if (active.data) redirect(withMessage(back, "error", t.updateInProgress));

  const { error } = await supabase.from("plant_updates").insert({
    plant_record_id: plant.uuid,
    status: "open",
    requested_by: user.id,
    botanist_id: plant.botanistId,
    ...updateRowPayload(plant.draft),
  });
  if (error) redirect(withMessage(back, "error", error.message));
  redirect(withMessage(back, "updated", "asked"));
}

export async function decidePlantUpdate(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const updateId = String(formData.get("update_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const { data: row, error } = await supabase
    .from("plant_updates")
    .select("*")
    .eq("uuid", updateId)
    .eq("status", "submitted")
    .maybeSingle();
  if (updatesSchemaMissing(error)) redirect(withMessage("/officer/plants", "error", t.updateSetup));
  if (!row) redirect(withMessage("/officer/plants", "error", "This update is not waiting for review."));

  const { data: plant } = await supabase.from("plant_records").select("id").eq("uuid", row.plant_record_id).maybeSingle();
  const back = plant?.id ? plantPath(String(plant.id)) : "/officer/plants";
  if (decision !== "approved" && decision !== "rejected") {
    redirect(withMessage(back, "error", "Choose approve or reject."));
  }

  if (decision === "rejected") {
    const photoError = await discardPendingPhotos(supabase, updateId);
    if (photoError) redirect(withMessage(back, "error", photoError));
    const { error: updateError } = await supabase
      .from("plant_updates")
      .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: user.id })
      .eq("uuid", updateId)
      .eq("status", "submitted");
    if (updateError) redirect(withMessage(back, "error", updateError.message));
    redirect(withMessage(back, "updated", "rejected"));
  }

  const draft = draftFromRow(row);
  const writeError = await applyPlantDraft(supabase, user.id, String(row.plant_record_id), draft);
  if (writeError) redirect(withMessage(back, "error", writeError));
  const publishError = await publishPendingPhotos(supabase, updateId);
  if (publishError) redirect(withMessage(back, "error", publishError));
  const hideError = await hideListedPhotos(supabase, String(row.plant_record_id), draft.hide_photo_ids);
  if (hideError) redirect(withMessage(back, "error", hideError));
  const { error: updateError } = await supabase
    .from("plant_updates")
    .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: user.id })
    .eq("uuid", updateId)
    .eq("status", "submitted");
  if (updateError) redirect(withMessage(back, "error", updateError.message));
  redirect(withMessage(back, "updated", "approved"));
}
