import { uploadPlantPhoto } from "@/lib/photos";
import { numberOrNull, qrCodeForRecord, textOrNull } from "@/lib/plant";
import { supabase } from "@/lib/supabase";
import type { FieldInput } from "@/types";

export async function resubmitRecord(userId: string, recordId: string, input: FieldInput) {
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
      status: "submitted",
    })
    .eq("uuid", recordId)
    .eq("botanist_id", userId);

  if (error) return error.message;

  if (input.photo_uri && !input.photo_uri.startsWith("http")) {
    const uploaded = await uploadPlantPhoto(userId, `${recordId}-${Date.now()}`, input.photo_uri);
    if (!uploaded.url) return uploaded.error ?? "Could not upload the photograph.";
    const photo = await supabase.from("plant_photos").insert({
      plant_record_id: recordId,
      storage_path: uploaded.url,
      caption: textOrNull(input.photo_caption),
      uploaded_by: userId,
    });
    if (photo.error) return photo.error.message;
  }

  return null;
}

export async function generateRecordQr(recordId: string) {
  const code = qrCodeForRecord(recordId);
  const { error } = await supabase.from("plant_records").update({ qr_code: code }).eq("uuid", recordId);
  if (error) return { code: null, error: error.message };
  return { code, error: null };
}
