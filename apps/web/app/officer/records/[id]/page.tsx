import { notFound } from "next/navigation";
import { BackPage } from "@/components/BackPage";
import { PlantView } from "@/components/PlantView";
import { ReviewDecisionForm } from "@/components/ReviewDecisionForm";
import { ReviewToast } from "@/components/ReviewToast";
import { StatusBadge } from "@/components/StatusBadge";
import { StickyBar } from "@/components/StickyBar";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { plantTagCode } from "@/lib/plant-access";
import { reviewNotice } from "@/lib/review-notice";
import { reviewRecord } from "../../actions";

export default async function OfficerRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string; error?: string; from?: string; done?: string; plant?: string }>;
}) {
  const { id } = await params;
  const { status = "submitted", q = "", error, from, done, plant } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();

  const { data: record, error: queryError } = await supabase
    .from("plant_records")
    .select(
      "uuid, id, qr_code, local_id, plant_name, life_stage, status, location_name, latitude, longitude, recorded_at, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits, review_note, species(scientific_name, common_name, local_name, family, genus, conservation_status, distribution, description, ecological_info, cultural_significance), profiles!plant_records_botanist_id_fkey(name)",
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
  const notice = reviewNotice(done, plant, t);
  const access = await supabase.from("plant_records").select("visibility").eq("uuid", record.uuid).maybeSingle();
  const rare = !access.error && access.data?.visibility === "rare";
  const here = `/officer/records/${record.uuid}?${listQuery}`;
  const speciesNotes = [
    [t.distribution, species?.distribution],
    [t.description, species?.description],
    [t.ecology, species?.ecological_info],
    [t.cultural, species?.cultural_significance],
  ].filter((item): item is [string, string] => typeof item[1] === "string" && item[1].trim() !== "");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <StickyBar>
        <div className="flex items-center gap-3">
          <BackPage href={from === "history" ? "/officer/history" : `/officer?${listQuery}`} label={t.backPage} />
          <StatusBadge status={record.status} />
        </div>
      </StickyBar>
      {notice && <ReviewToast message={notice.message} tone={notice.tone} />}
      {(error || photoError) && <p className="mt-3 text-sm text-red-700">{error || photoError?.message}</p>}
      {rare && <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm">{t.rarePlant}. {t.plantAccessHint}</p>}
      <div className="mt-4">
        <PlantView
          locale={locale}
          t={t}
          canPrint
          recordId={record.uuid}
          qrCode={plantTagCode(record)}
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
      {speciesNotes.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-neutral-500">{t.species}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {speciesNotes.map(([label, value]) => (
              <article key={label} className="surface px-5 py-4">
                <h3 className="text-sm font-medium text-forest">{label}</h3>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-neutral-800">{value}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {record.review_note && !earlierNote ? (
        <p className="surface mt-4 px-5 py-4 text-sm leading-6">
          <span className="font-medium text-neutral-500">{t.officerNote}</span>
          <span className="mt-2 block whitespace-pre-wrap text-neutral-800">{record.review_note}</span>
        </p>
      ) : null}

      {canDecide && (
        <ReviewDecisionForm
          action={reviewRecord}
          recordId={record.uuid}
          next={here}
          plantLabel={`${record.id} · ${record.plant_name || species?.scientific_name || t.unidentified}`}
          earlierNote={earlierNote}
          defaultNote={earlierNote ? "" : (record.review_note ?? "")}
          className="surface mt-4 space-y-3 px-5 py-4"
          labels={t}
        />
      )}
    </main>
  );
}

