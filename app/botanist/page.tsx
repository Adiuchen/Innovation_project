import Link from "next/link";
import { RecordSort } from "@/app/botanist/RecordSort";
import { PageHeading } from "@/components/PageHeading";
import { PendingDrafts } from "@/components/PendingDrafts";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

export default async function BotanistHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string }>;
}) {
  const { error: actionError, sort: requestedSort } = await searchParams;
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

  return (
    <main className="mx-auto flex h-[calc(100dvh-4.5rem)] max-w-5xl flex-col px-4">
      <PageHeading
        backHref="/dashboard"
        backLabel={t.backPage}
        title={t.fieldRecords}
        extra={<Link className="btn" href="/botanist/new">{t.newRecord}</Link>}
      />
      {(error || actionError) && <p className="shrink-0 text-sm text-red-700">{error?.message || actionError}</p>}
      <PendingDrafts t={t} />
      {sorted.some((record) => record.status === "needs_revision" || record.status === "rejected") && (
        <section id="notices" className="mt-4 max-h-40 shrink-0 overflow-y-auto rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-medium">{t.notices}</h2>
          <ul className="mt-2 space-y-3 text-sm">
            {sorted.filter((record) => record.status === "needs_revision" || record.status === "rejected").map((record) => {
              const species = Array.isArray(record.species) ? record.species[0] : record.species;
              return (
                <li key={record.uuid}>
                  <Link className="font-medium underline" href={`/botanist/${record.uuid}`}>
                    {record.id} · {record.plant_name || species?.scientific_name || t.unidentified}
                  </Link>
                  <p className="text-neutral-700">
                    {record.status === "rejected" ? t.noticeRejected : t.noticeRevision}
                  </p>
                  {record.review_note && <p>{t.officerNote}: {record.review_note}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <RecordSort
        sort={sort}
        label={t.sortBy}
        options={[
          { value: "newest", label: t.newest },
          { value: "oldest", label: t.oldest },
          { value: "name", label: t.plantName },
          { value: "place", label: t.place },
          { value: "status", label: t.status },
        ]}
      />
      <div className="mt-4 mb-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-emerald-950/15 bg-white shadow-sm">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-emerald-50 text-left text-forest">
                <th className="p-3 font-medium">{t.plantName}</th>
                <th className="p-3 font-medium">{t.place}</th>
                <th className="p-3 font-medium">{t.status}</th>
                <th className="p-3 font-medium">{t.review}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((record) => {
                const species = Array.isArray(record.species) ? record.species[0] : record.species;
                return (
                  <tr key={record.id} className={`border-b last:border-0 ${record.status === "needs_revision" || record.status === "rejected" ? "bg-amber-50" : ""}`}>
                    <td className="p-3">
                      <Link className="font-medium hover:underline" href={`/botanist/${record.uuid}`}>{record.id} · {record.plant_name || species?.scientific_name || t.unidentified}</Link>
                    </td>
                    <td className="p-3">{record.location_name || "—"}</td>
                    <td className="p-3"><StatusBadge status={record.status} /></td>
                    <td className="p-3">{record.review_note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
