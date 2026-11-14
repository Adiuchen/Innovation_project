import { notFound } from "next/navigation";
import { removePendingPhoto, saveBotanistPlantUpdate } from "@/app/botanist/updates/actions";
import { BackPage } from "@/components/BackPage";
import { PlantUpdateForm } from "@/components/PlantUpdateForm";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { draftFromRow, listLivePhotos, listPendingPhotos, listSpeciesChoices, type SpeciesChoice } from "@/lib/plant-update";

export default async function BotanistUpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const { supabase, user } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const { data: row } = await supabase
    .from("plant_updates")
    .select("*, plant_records(id, plant_name)")
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .in("status", ["open", "submitted"])
    .maybeSingle();
  if (!row) notFound();

  const plant = Array.isArray(row.plant_records) ? row.plant_records[0] : row.plant_records;
  const draft = draftFromRow(row);
  const species = await listSpeciesChoices(supabase, null);
  const currentMissing = draft.species_id && !species.some((item) => item.uuid === draft.species_id);
  const currentSpecies = currentMissing
    ? await supabase
        .from("species")
        .select("uuid, id, scientific_name, common_name, local_name, family, genus, description, conservation_status, distribution, ecological_info, cultural_significance")
        .eq("uuid", draft.species_id)
        .maybeSingle()
    : { data: null };
  const choices = currentSpecies.data ? [currentSpecies.data as SpeciesChoice, ...species] : species;
  const photos = await listLivePhotos(supabase, String(row.plant_record_id));
  const pending = row.status === "open" ? await listPendingPhotos(supabase, row.uuid) : [];
  const title = plant?.id ? `${plant.id} · ${draft.plant_name || plant.plant_name || t.unidentified}` : (draft.plant_name || t.unidentified);

  return (
    <main className="mx-auto max-w-3xl px-4 pt-4 pb-10">
      <BackPage href="/botanist" label={t.backPage} />
      <h1 className="mt-4 text-3xl font-semibold">{t.updateDetails}</h1>
      <p className="mt-1 text-sm text-neutral-600">{title}</p>
      {updated === "saved" && <p className="mt-3 rounded bg-emerald-50 px-3 py-2 text-sm">{t.updateSaved}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {row.status === "submitted" ? (
        <p className="mt-4 rounded bg-amber-50 px-3 py-2 text-sm">{t.updateWaitingOfficer}</p>
      ) : (
        <>
          {pending.length > 0 && (
            <ul className="mt-4 space-y-3">
              {pending.map((photo) => (
                <li key={photo.id} className="surface flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/photos/${photo.id}`} alt={photo.caption || ""} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{photo.caption || t.pendingPhoto}</p>
                    <p className="text-xs text-neutral-500">{t.pendingPhoto}</p>
                  </div>
                  <form action={removePendingPhoto}>
                    <input type="hidden" name="update_id" value={row.uuid} />
                    <input type="hidden" name="photo_id" value={photo.id} />
                    <button className="text-sm text-red-700" type="submit">{t.hidePhoto}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <PlantUpdateForm
            action={saveBotanistPlantUpdate}
            mode="botanist"
            updateId={row.uuid}
            draft={draft}
            species={choices}
            photos={photos}
            t={t}
          />
        </>
      )}
    </main>
  );
}
