import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { getCopy, statusText } from "@/lib/i18n";

export default async function MapPage() {
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const { data, error } = await supabase
    .from("plant_records")
    .select("uuid, id, plant_name, location_name, latitude, longitude, status, species(scientific_name)")
    .not("latitude", "is", null)
    .order("recorded_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/dashboard" backLabel={t.backPage} title={t.map} />
      <p className="mt-1 text-sm text-neutral-600">{t.mapIntro}</p>
      {error && <p className="mt-3 text-sm text-red-700">{error.message}</p>}
      <ul className="mt-4 divide-y surface">
        {(data ?? []).map((record) => {
          const species = Array.isArray(record.species) ? record.species[0] : record.species;
          const mapUrl = `https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=15/${record.latitude}/${record.longitude}`;
          return (
            <li key={record.uuid} className="px-4 py-3 text-sm">
              <p className="font-medium">{record.id} · {record.plant_name || species?.scientific_name || t.unidentified}</p>
              <p>
                {record.location_name || t.noPlaceName} · {record.latitude}, {record.longitude} · {statusText(record.status, t)}
              </p>
              <a href={mapUrl} target="_blank" rel="noreferrer">{t.openMap}</a>
            </li>
          );
        })}
        {(data ?? []).length === 0 && <li className="px-4 py-6 text-sm text-neutral-500">{t.noGps}</li>}
      </ul>
    </main>
  );
}
