import { notFound } from "next/navigation";
import { BackPage } from "@/components/BackPage";
import { PlantUpdateForm } from "@/components/PlantUpdateForm";
import { saveOfficerPlantUpdate } from "@/app/officer/plants/actions";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { listLivePhotos, listSpeciesChoices, loadApprovedPlant, updatesSchemaMissing } from "@/lib/plant-update";

export default async function OfficerEditPlantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const plantId = decodeURIComponent(id).trim().toUpperCase();
  const plant = await loadApprovedPlant(supabase, plantId);
  if (!plant) notFound();

  const active = await supabase
    .from("plant_updates")
    .select("uuid")
    .eq("plant_record_id", plant.uuid)
    .in("status", ["open", "submitted"])
    .maybeSingle();
  const species = await listSpeciesChoices(supabase, plant.species);
  const photos = await listLivePhotos(supabase, plant.uuid);

  return (
    <main className="mx-auto max-w-3xl px-4 pt-4 pb-10">
      <BackPage href={`/officer/plants/${encodeURIComponent(plant.id)}`} label={t.backPage} />
      <h1 className="mt-4 text-3xl font-semibold">{t.updateDetails}</h1>
      <p className="mt-1 text-sm text-neutral-600">{plant.id} · {plant.draft.plant_name || plant.draft.scientific_name}</p>
      {updatesSchemaMissing(active.error) && <p className="mt-3 text-sm text-neutral-600">{t.updateSetup}</p>}
      {active.data && <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm">{t.updateInProgress}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {!active.data && !updatesSchemaMissing(active.error) && (
        <PlantUpdateForm
          action={saveOfficerPlantUpdate}
          mode="officer"
          plantId={plant.id}
          draft={plant.draft}
          species={species}
          photos={photos}
          t={t}
        />
      )}
    </main>
  );
}
