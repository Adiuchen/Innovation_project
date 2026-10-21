import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { healthLabels, optionLabel } from "@/lib/field-choices";
import { getCopy } from "@/lib/i18n";
import { reviewRecord } from "./actions";

export default async function OfficerHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; error?: string }>;
}) {
  const { status = "submitted", q = "", error } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();

  let request = supabase
    .from("plant_records")
    .select("uuid, id, plant_name, status, location_name, latitude, longitude, recorded_at, health_status, review_note, species(scientific_name, common_name), profiles!plant_records_botanist_id_fkey(name)")
    .order("recorded_at", { ascending: false });

  if (status && status !== "all") request = request.eq("status", status);
  const { data: records, error: queryError } = await request;

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
        extra={<a className="text-sm underline" href="/officer/report">{t.exportCsv}</a>}
      />
      {(error || queryError) && (
        <p className="mt-3 text-sm text-red-700">{error || queryError?.message}</p>
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
          return (
            <article key={record.uuid} className="surface p-4">
              <h2 className="font-medium">{record.id} · {record.plant_name || species?.scientific_name || t.unidentified}</h2>
              <p className="text-sm text-neutral-600">
                {species?.common_name || t.noCommonName} · {botanist?.name || t.unknownBotanist} · <StatusBadge status={record.status} />
              </p>
              <p className="text-sm">
                {record.location_name || t.noPlaceName}
                {record.latitude != null ? ` · ${record.latitude}, ${record.longitude}` : ""}
                {record.health_status ? ` · ${t.health}: ${optionLabel(record.health_status, healthLabels(t))}` : ""}
              </p>
              {canDecide ? (
                <form action={reviewRecord} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={record.uuid} />
                  <textarea className="w-full rounded border px-2 py-1" name="review_note" rows={2} placeholder={t.noteToBotanist} defaultValue={record.review_note ?? ""} />
                  <div className="flex flex-wrap gap-2">
                    <Link className="inline-flex items-center rounded border border-forest px-3 py-1 text-sm font-semibold text-forest" href={reviewHref}>{t.reviewFull}</Link>
                    <button className="btn" name="status" value="approved">{t.approve}</button>
                    <button className="rounded border px-3 py-1" name="status" value="needs_revision">{t.requestChanges}</button>
                    <button className="rounded border border-red-300 px-3 py-1 text-red-800" name="status" value="rejected">{t.reject}</button>
                  </div>
                </form>
              ) : (
                <div className="mt-3">
                  <Link className="inline-flex items-center rounded border border-forest px-3 py-1 text-sm font-semibold text-forest" href={reviewHref}>{t.reviewFull}</Link>
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
