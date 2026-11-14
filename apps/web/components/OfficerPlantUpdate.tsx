import Link from "next/link";
import { askBotanistToUpdate, decidePlantUpdate } from "@/app/officer/plants/actions";
import { PlantUpdateCompare } from "@/components/PlantUpdateCompare";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { draftFromRow, listLivePhotos, listPendingPhotos, loadApprovedPlant, updatesSchemaMissing } from "@/lib/plant-update";

export async function OfficerPlantUpdate({
  plantId,
  recordedBy,
  error,
  updated,
}: {
  plantId: string;
  recordedBy?: string | null;
  error?: string;
  updated?: string;
}) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const plant = await loadApprovedPlant(supabase, plantId);
  if (!plant) return null;

  const active = await supabase
    .from("plant_updates")
    .select("*")
    .eq("plant_record_id", plant.uuid)
    .in("status", ["open", "submitted"])
    .maybeSingle();
  const missing = updatesSchemaMissing(active.error);
  const row = active.data;
  const botanistName = plant.botanistName || recordedBy || t.unknownBotanist;
  const submitted = row?.status === "submitted" ? row : null;
  const pendingPhotos = submitted ? await listPendingPhotos(supabase, String(submitted.uuid)) : [];
  const currentPhotos = submitted ? await listLivePhotos(supabase, plant.uuid) : [];
  const notice = flash(updated, error, t);

  return (
    <section className="mt-8 border-t border-emerald-950/10 pt-6">
      <h2 className="text-xl font-semibold">{t.updateDetails}</h2>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">{t.updateDetailsHint}</p>
      {notice && (
        <p className={`mt-3 rounded px-3 py-2 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-950" : "text-red-700"}`}>{notice.text}</p>
      )}
      {missing && <p className="mt-3 text-sm text-neutral-600">{t.updateSetup}</p>}
      {!missing && active.error && <p className="mt-3 text-sm text-red-700">{active.error.message}</p>}
      {!missing && !row && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link className="btn" href={`/officer/plants/${encodeURIComponent(plant.id)}/update`}>{t.editPlantNow}</Link>
          {plant.botanistId ? (
            <form action={askBotanistToUpdate}>
              <input type="hidden" name="plant_id" value={plant.id} />
              <button className="rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-semibold" type="submit">
                {t.askBotanistUpdate.replace("{name}", botanistName)}
              </button>
            </form>
          ) : (
            <p className="text-sm text-neutral-600">{t.noOriginalBotanist}</p>
          )}
        </div>
      )}
      {!missing && row?.status === "open" && (
        <p className="mt-4 rounded bg-amber-50 px-3 py-2 text-sm">{t.updateWaitingBotanist.replace("{name}", botanistName)}</p>
      )}
      {!missing && submitted && (
        <div className="mt-4">
          <h3 className="font-medium">{t.proposedUpdate}</h3>
          <PlantUpdateCompare
            before={plant.draft}
            after={draftFromRow(submitted)}
            currentPhotos={currentPhotos}
            pendingPhotos={pendingPhotos}
            t={t}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={decidePlantUpdate}>
              <input type="hidden" name="update_id" value={submitted.uuid} />
              <input type="hidden" name="decision" value="approved" />
              <button className="btn" type="submit">{t.approveUpdate}</button>
            </form>
            <form action={decidePlantUpdate}>
              <input type="hidden" name="update_id" value={submitted.uuid} />
              <input type="hidden" name="decision" value="rejected" />
              <button className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-800" type="submit">{t.rejectUpdate}</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function flash(updated: string | undefined, error: string | undefined, t: Awaited<ReturnType<typeof getCopy>>["t"]) {
  if (error) return { ok: false, text: error };
  if (updated === "saved" || updated === "approved") return { ok: true, text: t.updateApproved };
  if (updated === "asked") return { ok: true, text: t.updateRequested };
  if (updated === "rejected") return { ok: true, text: t.updateRejected };
  return null;
}
