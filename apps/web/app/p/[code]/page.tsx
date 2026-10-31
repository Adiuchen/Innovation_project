import Link from "next/link";
import { notFound } from "next/navigation";
import { BackPage } from "@/components/BackPage";
import { PlantView } from "@/components/PlantView";
import { getCopy } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function PublicPlantPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: plant } = await supabase
    .from("public_plant_pages")
    .select("*")
    .eq("qr_code", code)
    .maybeSingle();

  if (!plant) notFound();
  const { locale, t } = await getCopy();

  const { data: photos } = await supabase
    .from("public_plant_photos")
    .select("id, storage_path, caption")
    .eq("qr_code", code);

  const { data: species } = plant.scientific_name
    ? await supabase
        .from("species")
        .select("uuid")
        .eq("scientific_name", plant.scientific_name)
        .is("hidden_at", null)
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 pb-8">
      <BackPage href="/" label={t.backPage} />
      <div className="mt-4">
        <PlantView
          locale={locale}
          t={t}
          qrCode={code}
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
      {species?.uuid && (
        <Link className="btn mt-4 inline-flex" href={`/species/${species.uuid}`}>
          {t.seeDistributionMap}
        </Link>
      )}
    </main>
  );
}
