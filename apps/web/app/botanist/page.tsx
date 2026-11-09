import Link from "next/link";
import { RecordSort, type FieldRecordRow } from "@/app/botanist/RecordSort";
import { PageHeading } from "@/components/PageHeading";
import { PendingDrafts } from "@/components/PendingDrafts";
import { requireUser } from "@/lib/auth";
import { getCopy, statusText } from "@/lib/i18n";
import { statusTone } from "@/lib/status-tone";

export default async function BotanistHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; q?: string }>;
}) {
  const { error: actionError, sort: requestedSort, q = "" } = await searchParams;
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
    <main className="mx-auto flex h-[calc(100dvh-4.5rem)] max-w-5xl flex-col px-4">
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
      <PendingDrafts t={t} />
      {sorted.some((record) => record.status === "needs_revision" || record.status === "rejected") && (
        <section id="notices" className="mt-4 shrink-0">
          <h2 className="text-sm font-medium text-neutral-500">{t.notices}</h2>
          <ul className="mt-2 grid max-h-56 gap-2 overflow-y-auto">
            {sorted.filter((record) => record.status === "needs_revision" || record.status === "rejected").map((record) => {
              const species = Array.isArray(record.species) ? record.species[0] : record.species;
              const name = record.plant_name || species?.scientific_name || t.unidentified;
              const detail = record.review_note
                ? `${t.officerNote}: ${record.review_note}`
                : record.status === "rejected"
                  ? t.noticeRejected
                  : t.noticeRevision;
              return (
                <li key={record.uuid}>
                  <Link
                    href={`/botanist/${record.uuid}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-neutral-900">
                        {record.id} · {name}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-neutral-600">{detail}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(record.status)}`}>
                      {statusText(record.status, t)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
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
    </main>
  );
}
