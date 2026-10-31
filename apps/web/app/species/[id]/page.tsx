import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { PhotoList } from "@/components/PhotoList";
import { SpeciesMap, type MapPoint } from "@/components/SpeciesMap";
import { getSessionProfile } from "@/lib/auth";
import { getCopy, type Copy } from "@/lib/i18n";

type LocatedRecord = {
  uuid: string;
  id: string | null;
  plant_name: string | null;
  location_name: string | null;
  latitude: number;
  longitude: number;
  qr_code: string | null;
};

const STAFF_ROLES = ["botanist", "conservation_officer", "administrator"];

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: species } = await supabase.from("species").select("*").eq("uuid", id).is("hidden_at", null).maybeSingle();
  if (!species) notFound();
  const { t } = await getCopy();

  const publicPhotos = await supabase
    .from("public_species_photos")
    .select("id, storage_path, caption")
    .eq("species_id", id);
  const { data: photos } = publicPhotos.error
    ? await supabase
        .from("plant_photos")
        .select("id, storage_path, caption")
        .eq("species_id", id)
        .is("plant_record_id", null)
        .is("hidden_at", null)
    : publicPhotos;

  const { profile } = await getSessionProfile();
  const isStaff = !!profile && profile.status === "active" && STAFF_ROLES.includes(profile.role);

  // Staff read with their own session. Visitors cannot read plant_records directly, so the server
  // reads with the service key (if set) and only sends rounded areas to the browser.
  const reader = isStaff ? supabase : (createAdminClient() ?? supabase);
  const { data: located } = await reader
    .from("plant_records")
    .select("uuid, id, plant_name, location_name, latitude, longitude, qr_code")
    .eq("species_id", id)
    .eq("status", "approved")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const records = (located ?? []) as LocatedRecord[];
  const points = isStaff ? exactPoints(records, species.scientific_name, t) : areaPoints(records, t);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-8">
      <PageHeading backHref="/" backLabel={t.backPage} title={species.scientific_name} titleClassName="text-3xl font-semibold" />
      <article className="surface px-6 py-7">
      <p className="text-sm font-medium text-forest">{[species.family, species.genus].filter(Boolean).join(" · ")}</p>
      <p className="mt-1 text-neutral-700">
        {[species.common_name, species.local_name].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-5 space-y-3 text-sm">
        <Info label={t.conservationStatus} value={species.conservation_status} />
        <Info label={t.distribution} value={species.distribution} />
        <Info label={t.description} value={species.description} />
        <Info label={t.ecology} value={species.ecological_info} />
        <Info label={t.cultural} value={species.cultural_significance} />
      </div>
      <section className="mt-6 space-y-2">
        <h2 className="font-medium">{t.distributionMap}</h2>
        <p className="text-sm text-neutral-600">{isStaff ? t.distributionMapStaff : t.distributionMapPublic}</p>
        {points.length > 0 ? (
          <SpeciesMap points={points} approximate={!isStaff} linkLabel={t.viewPlant} />
        ) : (
          <p className="text-sm text-neutral-500">{t.noDistributionPoints}</p>
        )}
      </section>
      <PhotoList photos={photos ?? []} />
      </article>
    </main>
  );
}

function exactPoints(records: LocatedRecord[], scientificName: string, t: Copy): MapPoint[] {
  return records.map((record) => ({
    latitude: record.latitude,
    longitude: record.longitude,
    title: [record.id, record.plant_name || scientificName].filter(Boolean).join(" · "),
    subtitle: record.location_name || t.noPlaceName,
    href: record.qr_code ? `/p/${record.qr_code}` : null,
  }));
}

// Rounds to 2 decimal places (about 1 km) and groups plants in the same area,
// so visitors never receive an exact location.
function areaPoints(records: LocatedRecord[], t: Copy): MapPoint[] {
  const areas = new Map<string, MapPoint>();
  for (const record of records) {
    const latitude = Math.round(record.latitude * 100) / 100;
    const longitude = Math.round(record.longitude * 100) / 100;
    const key = `${latitude},${longitude}`;
    const area = areas.get(key) ?? { latitude, longitude, title: "", count: 0 };
    area.count = (area.count ?? 0) + 1;
    areas.set(key, area);
  }
  return [...areas.values()].map((area) => ({
    ...area,
    title: t.plantsInArea.replace("{count}", String(area.count)),
  }));
}

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="font-medium">{label}</p>
      <p className="whitespace-pre-wrap text-neutral-700">{value}</p>
    </div>
  );
}
