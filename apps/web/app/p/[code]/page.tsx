import Link from "next/link";
import { notFound } from "next/navigation";
import { BackPage } from "@/components/BackPage";
import { PlantView } from "@/components/PlantView";
import { getSessionProfile, isStaffRole } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { plantVisibility } from "@/lib/plant-access";
import { createClient } from "@/lib/supabase/server";

type PublicPlantRow = {
  plant_name?: string | null;
  life_stage?: string | null;
  scientific_name?: string | null;
  common_name?: string | null;
  local_name?: string | null;
  family?: string | null;
  genus?: string | null;
  conservation_status?: string | null;
  plant_id?: string | null;
  record_uuid?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  height_m?: number | null;
  health_status?: string | null;
  recorded_at?: string | null;
  recorded_by?: string | null;
};

function plantCodePrefix(code: string) {
  const match = /^plant-([0-9a-f]{8})$/i.exec(code.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

async function resolveCanonicalTag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: string,
): Promise<{ qr_code: string; status: string; visibility: "ordinary" | "rare" } | null> {
  const rpc = await supabase.rpc("resolve_plant_tag", { code });
  if (!rpc.error) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : null;
    if (row && typeof row.status === "string") {
      return {
        qr_code: typeof row.qr_code === "string" && row.qr_code ? row.qr_code : code,
        status: row.status,
        visibility: plantVisibility(row.visibility),
      };
    }
  }

  const byQr = await supabase.from("plant_records").select("qr_code, status").eq("qr_code", code).maybeSingle();
  if (!byQr.error && byQr.data && typeof byQr.data.status === "string") {
    return { qr_code: byQr.data.qr_code || code, status: byQr.data.status, visibility: "ordinary" };
  }

  const prefix = plantCodePrefix(code);
  if (prefix) {
    const aliased = await supabase
      .from("plant_records")
      .select("qr_code, status, local_id, uuid")
      .or(`local_id.ilike.${prefix}%,uuid.ilike.${prefix}%`)
      .limit(5);
    const hit = (aliased.data ?? []).find((row) => {
      const local = typeof row.local_id === "string" ? row.local_id.toLowerCase() : "";
      const uuid = typeof row.uuid === "string" ? row.uuid.toLowerCase() : "";
      return local.startsWith(prefix) || uuid.startsWith(prefix);
    });
    if (hit && typeof hit.status === "string") {
      return { qr_code: hit.qr_code || code, status: hit.status, visibility: "ordinary" };
    }
  }

  return null;
}

async function loadApprovedRecordAsPlant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: string,
): Promise<PublicPlantRow | null> {
  const { data, error } = await supabase
    .from("plant_records")
    .select(
      "uuid, id, plant_name, life_stage, location_name, latitude, longitude, height_m, health_status, recorded_at, status, qr_code, species(scientific_name, common_name, local_name, family, genus, conservation_status), profiles!plant_records_botanist_id_fkey(name)",
    )
    .eq("qr_code", code)
    .eq("status", "approved")
    .maybeSingle();
  if (error || !data) return null;

  const species = Array.isArray(data.species) ? data.species[0] : data.species;
  const botanist = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return {
    plant_name: data.plant_name,
    life_stage: data.life_stage,
    scientific_name: species?.scientific_name ?? null,
    common_name: species?.common_name ?? null,
    local_name: species?.local_name ?? null,
    family: species?.family ?? null,
    genus: species?.genus ?? null,
    conservation_status: species?.conservation_status ?? null,
    plant_id: data.id,
    record_uuid: data.uuid,
    location_name: data.location_name,
    latitude: data.latitude,
    longitude: data.longitude,
    height_m: data.height_m,
    health_status: data.health_status,
    recorded_at: data.recorded_at,
    recorded_by: botanist?.name ?? null,
  };
}

export default async function PublicPlantPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { locale, t } = await getCopy();

  const resolved = await resolveCanonicalTag(supabase, code);
  const lookupCode = resolved?.qr_code || code;

  if (resolved?.visibility === "rare") {
    const { profile } = await getSessionProfile();
    const staff = profile?.status === "active" && isStaffRole(profile.role);
    if (!staff) {
      return (
        <main className="mx-auto max-w-3xl px-4 pt-4 pb-16">
          <BackPage href="/" label={t.backPage} />
          <section className="mt-10 space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">{t.plantClosedTitle}</h1>
            <p className="max-w-xl text-base leading-7 text-neutral-600">{t.plantClosedBody}</p>
          </section>
        </main>
      );
    }
  }

  const { data: published } = await supabase
    .from("public_plant_pages")
    .select("*")
    .eq("qr_code", lookupCode)
    .maybeSingle();

  let plant: PublicPlantRow | null = published;
  if (!plant) {
    plant = await loadApprovedRecordAsPlant(supabase, lookupCode);
  }
  if (!plant && lookupCode !== code) {
    plant = await loadApprovedRecordAsPlant(supabase, code);
  }

  if (!plant) {
    const status = resolved?.status ?? null;
    if (status && status !== "approved") {
      return (
        <main className="mx-auto max-w-3xl px-4 pt-4 pb-16">
          <BackPage href="/" label={t.backPage} />
          <section className="mt-10 space-y-4">
            <p className="text-sm font-semibold tracking-wide text-forest uppercase">Plant tag</p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">In Progress</h1>
            <p className="max-w-xl text-base leading-7 text-neutral-600">
              This plant tag is registered and waiting for review. Public details will appear here after a conservation
              officer approves the record.
            </p>
            <p className="font-mono text-sm text-neutral-500">{code}</p>
          </section>
        </main>
      );
    }

    notFound();
  }

  const photoCode = published?.qr_code || lookupCode;
  const { data: publicPhotos } = await supabase
    .from("public_plant_photos")
    .select("id, storage_path, caption")
    .eq("qr_code", photoCode);
  const ownedPhotos = plant.record_uuid
    ? await supabase
        .from("plant_photos")
        .select("id, storage_path, caption")
        .eq("plant_record_id", plant.record_uuid)
        .is("hidden_at", null)
    : { data: null };
  const photos = publicPhotos?.length ? publicPhotos : ownedPhotos.data;

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
          qrCode={photoCode}
          photos={photos ?? []}
          plant={{
            plantName: plant.plant_name ?? null,
            lifeStage: plant.life_stage ?? null,
            scientificName: plant.scientific_name ?? null,
            commonName: plant.common_name ?? null,
            localName: plant.local_name ?? null,
            family: plant.family ?? null,
            genus: plant.genus ?? null,
            conservationStatus: plant.conservation_status ?? null,
            plantId: plant.plant_id ?? null,
            location: plant.location_name ?? null,
            latitude: plant.latitude ?? null,
            longitude: plant.longitude ?? null,
            heightM: plant.height_m ?? null,
            health: plant.health_status ?? null,
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
