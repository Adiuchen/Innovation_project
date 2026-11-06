import { storageObjectPath } from "@/lib/photo-path";
import { uploadPlantPhoto } from "@/lib/photos";
import { numberOrNull, qrCodeForRecord, textOrNull } from "@/lib/plant";
import { photoBucket, supabase } from "@/lib/supabase";
import type { FieldInput } from "@/types";

export async function resubmitRecord(
  userId: string,
  recordId: string,
  input: FieldInput,
  options: { keepStatus?: boolean } = {},
) {
  // A phone can keep the botanist's profile after the sign-in session has expired. Requests then
  // go out as a signed-out visitor, which the database refuses with "permission denied".
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    return "Your sign-in has expired. Open Settings, sign out, sign in again, then save once more. Your changes are still on this screen.";
  }

  // Check the record is still editable with a plain read (the same check the website uses),
  // instead of asking the update to return the row.
  const { data: current, error: readError } = await supabase
    .from("plant_records")
    .select("status, qr_code, local_id")
    .eq("uuid", recordId)
    .eq("botanist_id", userId)
    .maybeSingle();
  if (readError) return friendlyError(readError.message);
  if (!current || !["draft", "needs_revision", "rejected"].includes(current.status)) {
    return "This record can no longer be edited. Pull down to refresh.";
  }

  // Never overwrite an existing tag. Prefer local_id so offline-printed codes stay stable.
  const assignQr =
    !options.keepStatus && !current.qr_code
      ? qrCodeForRecord(
          typeof current.local_id === "string" && current.local_id.length >= 8 ? current.local_id : recordId,
        )
      : null;

  // keepStatus saves the edits without sending the record for review.
  const { error } = await supabase
    .from("plant_records")
    .update({
      plant_name: textOrNull(input.plant_name),
      life_stage: textOrNull(input.life_stage),
      species_id: input.species_id,
      height_m: numberOrNull(input.height_m),
      trunk_diameter_cm: numberOrNull(input.trunk_diameter_cm),
      leaf_traits: textOrNull(input.leaf_traits),
      flower_fruit_traits: textOrNull(input.flower_fruit_traits),
      health_status: textOrNull(input.health_status),
      other_traits: textOrNull(input.other_traits),
      location_name: textOrNull(input.location_name),
      latitude: numberOrNull(input.latitude),
      longitude: numberOrNull(input.longitude),
      ...(options.keepStatus ? {} : { status: "submitted" }),
      ...(assignQr ? { qr_code: assignQr } : {}),
    })
    .eq("uuid", recordId)
    .eq("botanist_id", userId)
    .in("status", ["draft", "needs_revision", "rejected"]);

  if (error) return friendlyError(error.message);

  // Photos already in the central database have remote_url set; only new ones are uploaded.
  for (const photo of input.photos ?? []) {
    if (photo.remote_url) continue;
    const uploaded = await uploadPlantPhoto(userId, `${recordId}-${photo.id}`, photo.uri);
    if (!uploaded.url) return uploaded.error ?? "Could not upload the photograph.";
    const inserted = await supabase.from("plant_photos").insert({
      plant_record_id: recordId,
      storage_path: uploaded.url,
      caption: textOrNull(photo.caption),
      uploaded_by: userId,
    });
    if (inserted.error) return inserted.error.message;
  }

  return null;
}

export async function generateRecordQr(recordId: string) {
  const { data: current, error: readError } = await supabase
    .from("plant_records")
    .select("qr_code, local_id")
    .eq("uuid", recordId)
    .maybeSingle();
  if (readError) return { code: null, error: readError.message };
  if (!current) return { code: null, error: "This record was not found." };
  if (current.qr_code) return { code: current.qr_code, error: null };

  const code = qrCodeForRecord(
    typeof current.local_id === "string" && current.local_id.length >= 8 ? current.local_id : recordId,
  );
  const { error } = await supabase
    .from("plant_records")
    .update({ qr_code: code })
    .eq("uuid", recordId)
    .is("qr_code", null);
  if (error) return { code: null, error: error.message };
  return { code, error: null };
}

function friendlyError(message: string) {
  if (/permission denied/i.test(message)) {
    return "The database refused this change (permission denied). Sign out and sign in again. If it still happens, ask the administrator to check that botanists may update their own plant records.";
  }
  return message;
}

// Permanently delete one of the botanist's own uploaded records while it is still a draft.
export async function deleteRemoteDraft(userId: string, recordId: string) {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return "Your sign-in has expired. Sign out and sign in again, then try once more.";

  const { data: current, error: readError } = await supabase
    .from("plant_records")
    .select("status")
    .eq("uuid", recordId)
    .eq("botanist_id", userId)
    .maybeSingle();
  if (readError) return deleteError(readError.message);
  if (!current || current.status !== "draft") return "Only drafts can be deleted.";

  // Capture paths first so storage cleanup can run after the row is gone.
  const { data: photos } = await supabase.from("plant_photos").select("storage_path").eq("plant_record_id", recordId);

  // Prefer the security-definer RPC: plain table DELETE often fails when the
  // authenticated role has no DELETE grant, even after RLS policies exist.
  const rpc = await supabase.rpc("delete_own_draft", { p_record_id: recordId });
  if (rpc.error) {
    if (!/could not find the function|schema cache|does not exist/i.test(rpc.error.message)) {
      return deleteError(rpc.error.message);
    }

    // Older databases that only have the table policies / grants.
    const photoDelete = await supabase.from("plant_photos").delete().eq("plant_record_id", recordId);
    if (photoDelete.error) return deleteError(photoDelete.error.message);

    const { error } = await supabase
      .from("plant_records")
      .delete()
      .eq("uuid", recordId)
      .eq("botanist_id", userId)
      .eq("status", "draft");
    if (error) return deleteError(error.message);
  }

  // Best effort: an image file left behind does not bring the draft back.
  const paths = (photos ?? [])
    .map((photo) => storageObjectPath(photo.storage_path))
    .filter((path): path is string => Boolean(path));
  if (paths.length > 0) await supabase.storage.from(photoBucket).remove(paths);
  return null;
}

function deleteError(message: string) {
  if (/could not find the function|schema cache|does not exist/i.test(message)) {
    return "The database is missing delete_own_draft. Ask the administrator to run the full supabase/delete-drafts.sql script.";
  }
  if (/permission denied|row-level security/i.test(message)) {
    return "The database still blocks deleting drafts. Ask the administrator to re-run the full supabase/delete-drafts.sql script (grants + delete_own_draft function), then try again.";
  }
  return message;
}
