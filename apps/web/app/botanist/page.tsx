import Link from "next/link";
import { RecordSort, type FieldRecordRow } from "@/app/botanist/RecordSort";
import { PageHeading } from "@/components/PageHeading";
import { PendingDrafts } from "@/components/PendingDrafts";
import { requireUser } from "@/lib/auth";
import { getCopy, statusText } from "@/lib/i18n";
import { updatesSchemaMissing } from "@/lib/plant-update";
import { statusTone } from "@/lib/status-tone";

export default async function BotanistHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; q?: string; updated?: string }>;
}) {
  const { error: actionError, sort: requestedSort, q = "", updated } = await searchParams;
  const { supabase, user } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const sort = ["newest", "oldest", "name", "place", "status"].includes(requestedSort ?? "")
    ? requestedSort!
    : "newest";
  const { data: records, error } = await supabase
    .from("plant_records")
    .select("uuid, id, plant_name, status, location_name, recorded_at, qr_code, review_note, species(scientific_name)")
    .eq("botanist_id", user.id)
    .order("recorded_at", { ascending: false });
  const statusOrder = ["draft", "submitted", "needs_revision", "approved", "rejected"];
  const sorted = [...(records ?? [])].sort((a, b) => {
    const speciesA = Array.isArray(a.species) ? a.species[0] : a.species;
    const speciesB = Array.isArray(b.species) ? b.species[0] : b.species;
    const nameA = a.plant_name || speciesA?.scientific_name || "";
    const nameB = b.plant_name || speciesB?.scientific_name || "";
    if (sort === "oldest") return a.recorded_at.localeCompare(b.recorded_at);
    if (sort === "name") return nameA.localeCompare(nameB);
    if (sort === "place") return (a.location_name || "").localeCompare(b.location_name || "");
    if (sort === "status") return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    return b.recorded_at.localeCompare(a.recorded_at);
  });
  const requested = await supabase
    .from("plant_updates")
    .select("uuid, status, plant_name, plant_records(id)")
    .eq("botanist_id", user.id)
    .eq("status", "open");
  const updateRequests = updatesSchemaMissing(requested.error) ? [] : (requested.data ?? []);
  const attention = sorted.filter((record) => record.status === "needs_revision" || record.status === "rejected");
  const rows: FieldRecordRow[] = sorted.map((record) => {
    const species = Array.isArray(record.species) ? record.species[0] : record.species;
    return {
      uuid: record.uuid,
      id: record.id,
      title: `${record.id} · ${record.plant_name || species?.scientific_name || t.unidentified}`,
      place: record.location_name || "—",
      status: record.status,
      statusLabel: statusText(record.status, t),
      review: record.review_note || "—",
      attention: record.status === "needs_revision" || record.status === "rejected",
      search: `${record.id} ${record.plant_name ?? ""} ${species?.scientific_name ?? ""}`.toLowerCase(),
    };
  });

  return (
    <main className="mx-auto flex h-[calc(100dvh-4.5rem)] max-w-5xl flex-col px-4 pb-4">
      <PageHeading
        backHref="/dashboard"
        backLabel={t.backPage}
        title={t.fieldRecords}
        extra={
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-full border border-emerald-950/15 bg-white px-3 py-1.5 text-sm" href="/botanist/plants">{t.viewPlants}</Link>
            <Link className="btn" href="/botanist/new">{t.newRecord}</Link>
          </div>
        }
      />
      {(error || actionError) && <p className="shrink-0 text-sm text-red-700">{error?.message || actionError}</p>}
      {updated === "submitted" && <p className="mt-3 shrink-0 rounded bg-emerald-50 px-3 py-2 text-sm">{t.updateSubmitted}</p>}
      <PendingDrafts t={t} />
      <div className={attention.length > 0 || updateRequests.length > 0
        ? "mt-4 grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-1"
        : "mt-4 flex min-h-0 flex-1 flex-col"}>
      <RecordSort
        sort={sort}
        query={q}
        label={t.sortBy}
        placeholder={t.searchPlants}
        emptyLabel={t.noSpeciesYet}
        noMatchesLabel={t.noRecordMatches}
        columns={{ name: t.plantName, place: t.place, status: t.status, review: t.review }}
        options={[
          { value: "newest", label: t.newest },
          { value: "oldest", label: t.oldest },
          { value: "name", label: t.plantName },
          { value: "place", label: t.place },
          { value: "status", label: t.status },
        ]}
        rows={rows}
      />
      {(attention.length > 0 || updateRequests.length > 0) && (
        <aside id="notices" className="order-first flex max-h-56 min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white lg:order-none lg:max-h-none">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {updateRequests.length > 0 && (
              <section>
                <h2 className="px-4 pt-3 text-sm font-medium text-neutral-500">{t.updatesRequested}</h2>
                <ul>
                  {updateRequests.map((item) => {
                    const linked = Array.isArray(item.plant_records) ? item.plant_records[0] : item.plant_records;
                    const label = [linked?.id, item.plant_name || t.unidentified].filter(Boolean).join(" · ");
                    return (
                      <li key={item.uuid} className="border-b border-emerald-950/10">
                        <Link href={`/botanist/updates/${item.uuid}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-amber-50">
                          <span className="min-w-0 truncate text-sm font-medium">{label}</span>
                          <span className="shrink-0 text-sm text-neutral-600">{t.openUpdate}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            {attention.length > 0 && (
              <section>
                <h2 className="px-4 pt-3 text-sm font-medium text-neutral-500">{t.notices}</h2>
                <ul>
                  {attention.map((record) => {
                    const species = Array.isArray(record.species) ? record.species[0] : record.species;
                    const name = record.plant_name || species?.scientific_name || t.unidentified;
                    const detail = record.review_note
                      ? `${t.officerNote}: ${record.review_note}`
                      : record.status === "rejected"
                        ? t.noticeRejected
                        : t.noticeRevision;
                    return (
                      <li key={record.uuid} className="border-b border-emerald-950/10 last:border-0">
                        <Link href={`/botanist/${record.uuid}`} className="block px-4 py-3 hover:bg-amber-50">
                          <span className="flex items-start justify-between gap-2">
                            <span className="min-w-0 truncate text-sm font-medium text-neutral-900">{record.id} · {name}</span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(record.status)}`}>
                              {statusText(record.status, t)}
                            </span>
                          </span>
                          <span className="mt-1 line-clamp-2 block text-sm leading-5 text-neutral-600">{detail}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </aside>
      )}
      </div>
    </main>
  );
}
