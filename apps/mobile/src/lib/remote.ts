import { uploadPlantPhoto } from "@/lib/photos";
import { numberOrNull, qrCodeForRecord, textOrNull } from "@/lib/plant";
import { siteUrl, supabase } from "@/lib/supabase";
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
  const code = qrCodeForRecord(recordId);
  const { error } = await supabase.from("plant_records").update({ qr_code: code }).eq("uuid", recordId);
  if (error) return { code: null, error: error.message };
  return { code, error: null };
}

export async function printPlantQr(qrCode: string) {
  if (!siteUrl) return "Set EXPO_PUBLIC_SITE_URL to the website address before printing.";
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return "Sign in again before printing.";

  try {
    const response = await fetch(`${siteUrl}/api/print/plant-qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qrCode }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) return body?.error || "printer";
    return null;
  } catch {
    return "printer";
  }
}
