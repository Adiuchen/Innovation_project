import { notFound } from "next/navigation";
import { PlantView } from "@/components/PlantView";
import { RecordTopic } from "@/components/RecordTopic";
import { requireUser } from "@/lib/auth";
import { healthLabels, optionLabel } from "@/lib/field-choices";
import { getCopy } from "@/lib/i18n";

export default async function OfficerApprovedPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();
  const plantId = decodeURIComponent(id).trim().toUpperCase();
  const { data: plant } = await supabase
    .from("public_plant_pages")
    .select("*")
    .eq("plant_id", plantId)
    .maybeSingle();

  if (!plant) notFound();

  const { data: photos } = await supabase
    .from("public_plant_photos")
    .select("id, storage_path, caption")
    .eq("qr_code", plant.qr_code);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <RecordTopic
        backHref="/officer/plants"
        backLabel={t.backPage}
        title={plant.plant_name || plant.scientific_name || t.unidentifiedPlant}
        subtitle={[plant.plant_name ? plant.scientific_name : null, plant.common_name, plant.local_name].filter(Boolean).join(" · ")}
      >
        {plant.conservation_status && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-forest">{plant.conservation_status}</span>
        )}
        {plant.health_status && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">{optionLabel(plant.health_status, healthLabels(t))}</span>
        )}
      </RecordTopic>
      <div className="mt-4">
        <PlantView
          locale={locale}
          t={t}
          showTitle={false}
          photos={photos ?? []}
          plant={{
            plantName: plant.plant_name ?? null,
            lifeStage: plant.life_stage ?? null,
            scientificName: plant.scientific_name,
            commonName: plant.common_name,
            localName: plant.local_name,
            family: plant.family,
            genus: plant.genus,
            conservationStatus: plant.conservation_status,
            plantId: plant.plant_id ?? null,
            location: plant.location_name ?? null,
            latitude: plant.latitude ?? null,
            longitude: plant.longitude ?? null,
            heightM: plant.height_m ?? null,
            health: plant.health_status,
            recordedAt: plant.recorded_at ?? null,
            recordedBy: plant.recorded_by ?? null,
          }}
        />
      </div>
    </main>
  );
}
