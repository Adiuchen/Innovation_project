import { notFound } from "next/navigation";
import { BackPage } from "@/components/BackPage";
import { PlantView } from "@/components/PlantView";
import { StatusBadge } from "@/components/StatusBadge";
import { StickyBar } from "@/components/StickyBar";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { reviewRecord } from "../../actions";

export default async function OfficerRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string; error?: string }>;
}) {
  const { id } = await params;
  const { status = "submitted", q = "", error } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();

  const { data: record, error: queryError } = await supabase
    .from("plant_records")
    .select(
      "uuid, id, plant_name, life_stage, status, location_name, latitude, longitude, recorded_at, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits, review_note, species(scientific_name, common_name, local_name, family, genus, conservation_status, distribution, description, ecological_info, cultural_significance), profiles!plant_records_botanist_id_fkey(name)",
    )
    .eq("uuid", id)
    .maybeSingle();

  if (queryError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-700">{queryError.message}</p>
      </main>
    );
  }
  if (!record) notFound();

  const { data: photos, error: photoError } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("plant_record_id", record.uuid)
    .is("hidden_at", null);

  const species = Array.isArray(record.species) ? record.species[0] : record.species;
  const botanist = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
  const canDecide = record.status === "submitted" || record.status === "needs_revision";
  const earlierNote = record.status === "submitted" ? record.review_note : null;
  const listQuery = new URLSearchParams({ status, q }).toString();
  const here = `/officer/records/${record.uuid}?${listQuery}`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <StickyBar>
        <div className="flex items-center gap-3">
          <BackPage href={`/officer?${listQuery}`} label={t.backPage} />
          <StatusBadge status={record.status} />
        </div>
      </StickyBar>
      {(error || photoError) && <p className="mt-3 text-sm text-red-700">{error || photoError?.message}</p>}
      <div className="mt-4">
        <PlantView
          locale={locale}
          t={t}
          photos={photos ?? []}
          plant={{
            plantName: record.plant_name,
            lifeStage: record.life_stage,
            scientificName: species?.scientific_name ?? null,
            commonName: species?.common_name ?? null,
            localName: species?.local_name ?? null,
            family: species?.family ?? null,
            genus: species?.genus ?? null,
            conservationStatus: species?.conservation_status ?? null,
            plantId: record.id,
            location: record.location_name,
            latitude: record.latitude,
            longitude: record.longitude,
            heightM: record.height_m,
            health: record.health_status,
            recordedAt: record.recorded_at,
            recordedBy: botanist?.name ?? null,
          }}
        />
      </div>
      <article className="surface mt-6 px-6 py-7">
        <dl className="space-y-3 text-sm">
          <Info label={t.distribution} value={species?.distribution} />
          <Info label={t.description} value={species?.description} />
          <Info label={t.ecology} value={species?.ecological_info} />
          <Info label={t.cultural} value={species?.cultural_significance} />
          {record.review_note && !earlierNote ? <Info label={t.officerNote} value={record.review_note} /> : null}
        </dl>

        {canDecide && (
          <form action={reviewRecord} className="mt-6 space-y-2 border-t pt-4">
            <input type="hidden" name="id" value={record.uuid} />
            <input type="hidden" name="next" value={here} />
            {earlierNote ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <span className="font-medium">{t.earlierNote}</span>
                <span className="mt-1 block whitespace-pre-wrap">{earlierNote}</span>
                <span className="mt-1 block text-xs text-amber-800">{t.earlierNoteHint}</span>
              </p>
            ) : null}
            <textarea
              className="w-full rounded border px-2 py-1"
              name="review_note"
              rows={3}
              placeholder={t.noteToBotanist}
              defaultValue={earlierNote ? "" : (record.review_note ?? "")}
            />
            <div className="flex flex-wrap gap-2">
              <button className="btn" name="status" value="approved">
                {t.approve}
              </button>
              <button className="rounded border px-3 py-1" name="status" value="needs_revision">
                {t.requestChanges}
              </button>
              <button className="rounded border border-red-300 px-3 py-1 text-red-800" name="status" value="rejected">
                {t.reject}
              </button>
            </div>
          </form>
        )}
      </article>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="whitespace-pre-wrap text-neutral-700">{value == null || value === "" ? "—" : value}</dd>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return <Field label={label} value={value} />;
}

