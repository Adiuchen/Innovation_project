import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { ReviewDecisionForm } from "@/components/ReviewDecisionForm";
import { ReviewToast } from "@/components/ReviewToast";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { healthLabels, optionLabel } from "@/lib/field-choices";
import { getCopy } from "@/lib/i18n";
import { reviewNotice } from "@/lib/review-notice";
import { updatesSchemaMissing } from "@/lib/plant-update";
import { reviewRecord } from "./actions";

export default async function OfficerHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; error?: string; done?: string; plant?: string }>;
}) {
  const { status = "submitted", q = "", error, done, plant } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();

  let request = supabase
    .from("plant_records")
    .select("uuid, id, plant_name, status, location_name, latitude, longitude, recorded_at, health_status, review_note, species(scientific_name, common_name), profiles!plant_records_botanist_id_fkey(name)")
    .order("recorded_at", { ascending: false });

  if (status && status !== "all") request = request.eq("status", status);
  const { data: records, error: queryError } = await request;

  const waitingUpdates = await supabase
    .from("plant_updates")
    .select("uuid, plant_name, plant_records(id, plant_name)")
    .eq("status", "submitted");
  const plantUpdates = updatesSchemaMissing(waitingUpdates.error) ? [] : (waitingUpdates.data ?? []);
  const notice = reviewNotice(done, plant, t);
  const next = `/officer?${new URLSearchParams({ status, ...(q ? { q } : {}) }).toString()}`;
  const query = q.trim().toLowerCase();
  const filtered = (records ?? []).filter((record) => {
    if (!query) return true;
    const species = Array.isArray(record.species) ? record.species[0] : record.species;
    const blob = `${record.plant_name ?? ""} ${species?.scientific_name ?? ""} ${species?.common_name ?? ""} ${record.location_name ?? ""}`.toLowerCase();
    return blob.includes(query);
  });

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading
        backHref="/dashboard"
        backLabel={t.backPage}
        title={t.reviewRecords}
        extra={
          <div className="flex flex-wrap items-center gap-3">
            <Link className="rounded-full border border-emerald-950/15 bg-white px-3 py-1.5 text-sm" href="/officer/history">{t.history}</Link>
            <a className="text-sm underline" href="/officer/report">{t.exportCsv}</a>
          </div>
        }
      />
      {notice && <ReviewToast message={notice.message} tone={notice.tone} />}
      {(error || queryError) && (
        <p className="mt-3 text-sm text-red-700">{error || queryError?.message}</p>
      )}
      {plantUpdates.length > 0 && (
        <section className="mt-4">
          <h2 className="text-sm font-medium text-neutral-500">{t.reviewPlantUpdates}</h2>
          <ul className="mt-2 grid gap-2">
            {plantUpdates.map((item) => {
              const linked = Array.isArray(item.plant_records) ? item.plant_records[0] : item.plant_records;
              const plantId = linked?.id;
              const label = [plantId, item.plant_name || linked?.plant_name || t.unidentified].filter(Boolean).join(" · ");
              return (
                <li key={item.uuid}>
                  <Link
                    href={plantId ? `/officer/plants/${encodeURIComponent(plantId)}` : "/officer/plants"}
                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100"
                  >
                    <span className="min-w-0 truncate font-medium">{label}</span>
                    <span className="shrink-0 text-sm">{t.approveUpdate}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <form className="mt-4 flex flex-wrap gap-2" action="/officer">
        <input className="rounded border px-2 py-1" name="q" defaultValue={q} placeholder={t.speciesOrPlace} />
        <select className="rounded border px-2 py-1" name="status" defaultValue={status}>
          <option value="submitted">{t.submitted}</option>
          <option value="needs_revision">{t.changesRequested}</option>
          <option value="approved">{t.approved}</option>
          <option value="rejected">{t.rejected}</option>
          <option value="draft">{t.draft}</option>
          <option value="all">{t.all}</option>
        </select>
        <button className="btn" type="submit">{t.filter}</button>
      </form>
      <div className="mt-4 space-y-4">
        {filtered.map((record) => {
          const species = Array.isArray(record.species) ? record.species[0] : record.species;
          const botanist = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
          const reviewHref = `/officer/records/${record.uuid}?${new URLSearchParams({ status, q }).toString()}`;
          const canDecide = record.status === "submitted" || record.status === "needs_revision";
          const earlierNote = record.status === "submitted" ? record.review_note : null;
          return (
            <article key={record.uuid} className="surface px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">{record.id} · {record.plant_name || species?.scientific_name || t.unidentified}</h2>
                <StatusBadge status={record.status} />
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {species?.common_name || t.noCommonName} · {botanist?.name || t.unknownBotanist}
              </p>
              <p className="mt-1 text-sm text-neutral-800">
                {record.location_name || t.noPlaceName}
                {record.latitude != null ? ` · ${record.latitude}, ${record.longitude}` : ""}
                {record.health_status ? ` · ${t.health}: ${optionLabel(record.health_status, healthLabels(t))}` : ""}
              </p>
              {canDecide ? (
                <ReviewDecisionForm
                  action={reviewRecord}
                  recordId={record.uuid}
                  next={next}
                  plantLabel={`${record.id} · ${record.plant_name || species?.scientific_name || t.unidentified}`}
                  earlierNote={earlierNote}
                  defaultNote={earlierNote ? "" : (record.review_note ?? "")}
                  reviewHref={reviewHref}
                  showNote={false}
                  className="mt-4 space-y-3"
                  labels={t}
                />
              ) : (
                <div className="mt-4 flex justify-end border-t border-emerald-950/10 pt-3">
                  <Link className="inline-flex h-9 items-center rounded-lg border border-forest bg-white px-3 text-sm font-semibold text-forest" href={reviewHref}>{t.reviewFull}</Link>
                </div>
              )}
            </article>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-neutral-500">{t.noRecordsFilter}</p>}
      </div>
    </main>
  );
}
