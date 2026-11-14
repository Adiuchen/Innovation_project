import { IotKitBoard, type IotKitPlant } from "@/components/IotKitBoard";
import { PageHeading } from "@/components/PageHeading";
import { requireUser, type Profile } from "@/lib/auth";
import { kitPlantId, loadIotKitPlantId } from "@/lib/iot-kit";
import { getCopy } from "@/lib/i18n";
import { listStaffPlants } from "@/lib/staff-plants";

export async function IotKitPage({
  roles,
  basePath,
}: {
  roles: Profile["role"][];
  basePath: string;
}) {
  const { supabase } = await requireUser(roles);
  const { t } = await getCopy();
  const [{ plants, error: listError }, kit] = await Promise.all([
    listStaffPlants(supabase),
    loadIotKitPlantId(supabase),
  ]);
  const rows: IotKitPlant[] = plants.map((plant) => {
    const name = plant.plant_name || plant.scientific_name || plant.common_name || t.unidentified;
    const detail = [plant.scientific_name, plant.common_name, plant.local_name, plant.location_name]
      .filter((part) => part && part !== name)
      .join(" · ");
    return {
      id: kitPlantId(plant.plant_id) ?? plant.plant_id,
      name,
      detail,
      search: [plant.plant_name, plant.scientific_name, plant.common_name, plant.local_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-4">
      <PageHeading
        backHref="/dashboard"
        backLabel={t.backPage}
        title={t.iotDashboard}
        titleClassName="text-xl font-semibold sm:text-2xl"
      />
      {(listError || kit.error) && <p className="mt-3 text-sm text-red-700">{listError || kit.error}</p>}
      <IotKitBoard
        plants={rows}
        assignedId={kit.plantId}
        basePath={basePath}
        searchLabel={t.searchPlant}
        assignSetupLabel={t.assignSetup}
        cancelLabel={t.cancel}
        assignLabel={t.assignKit}
        noSetupLabel={t.noSetup}
        noResultLabel={t.noResult}
      />
    </main>
  );
}
