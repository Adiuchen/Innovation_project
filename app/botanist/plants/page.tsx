import { ApprovedPlantList, type ApprovedPlantRow } from "@/app/botanist/plants/ApprovedPlantList";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

export default async function ApprovedPlantsPage() {
  const { supabase } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const { data, error } = await supabase
    .from("public_plant_pages")
    .select("plant_id, plant_name, scientific_name, common_name, local_name, location_name, recorded_by, recorded_at")
    .order("recorded_at", { ascending: false });

  const rows: ApprovedPlantRow[] = (data ?? []).map((plant) => {
    const name = plant.plant_name || plant.scientific_name || t.unidentified;
    return {
      id: plant.plant_id,
      name,
      place: plant.location_name ?? "",
      recordedBy: plant.recorded_by ?? "",
      recordedAt: plant.recorded_at ?? "",
      search: `${plant.plant_id} ${plant.plant_name ?? ""} ${plant.scientific_name ?? ""} ${plant.common_name ?? ""} ${plant.local_name ?? ""} ${plant.recorded_by ?? ""}`.toLowerCase(),
    };
  });

  return (
    <main className="mx-auto flex h-[calc(100dvh-4.5rem)] max-w-5xl flex-col px-4">
      <PageHeading backHref="/dashboard" backLabel={t.backPage} title={t.viewPlants} />
      <p className="shrink-0 text-sm text-neutral-600">{t.approvedOnly}</p>
      {error && <p className="shrink-0 text-sm text-red-700">{error.message}</p>}
      <ApprovedPlantList
        rows={rows}
        basePath="/botanist/plants"
        label={t.sortBy}
        placeholder={t.searchPlants}
        emptyLabel={t.noSpeciesYet}
        noMatchesLabel={t.noRecordMatches}
        columns={{ name: t.plantName, place: t.place, recordedBy: t.recordedBy }}
        options={[
          { value: "newest", label: t.newest },
          { value: "oldest", label: t.oldest },
          { value: "name", label: t.plantName },
          { value: "place", label: t.place },
        ]}
      />
    </main>
  );
}
