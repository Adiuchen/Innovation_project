import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { getCopy, type Locale } from "@/lib/i18n";

const KINDS = ["all", "approved", "rejected", "changes"] as const;
type Kind = (typeof KINDS)[number];

function formatWhen(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "ms" ? "ms-MY" : "en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function OfficerHistory({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind: rawKind = "all" } = await searchParams;
  const kind: Kind = KINDS.includes(rawKind as Kind) ? (rawKind as Kind) : "all";
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();

  const { data: records, error } = await supabase
    .from("plant_records")
    .select(
      "uuid, id, plant_name, status, location_name, reviewed_at, review_note, species(scientific_name, common_name), profiles!plant_records_botanist_id_fkey(name), reviewer:profiles!plant_records_reviewed_by_fkey(id, name)",
    )
    .in("status", ["approved", "rejected", "needs_revision", "submitted"])
    .order("reviewed_at", { ascending: false });

  const history = (records ?? [])
    .filter((record) => {
      if (record.status === "submitted" && !record.review_note) return false;
      if (kind === "approved") return record.status === "approved";
      if (kind === "rejected") return record.status === "rejected";
      if (kind === "changes") return record.status === "needs_revision" || record.status === "submitted";
      return record.status !== "submitted" || Boolean(record.review_note);
    })
    .sort((a, b) => {
      const left = a.reviewed_at ? Date.parse(a.reviewed_at) : 0;
      const right = b.reviewed_at ? Date.parse(b.reviewed_at) : 0;
      return right - left;
    });

  const filters: { kind: Kind; label: string }[] = [
    { kind: "all", label: t.all },
    { kind: "approved", label: t.approved },
    { kind: "rejected", label: t.rejected },
    { kind: "changes", label: t.changesRequested },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/officer" backLabel={t.backPage} title={t.history} />
      <p className="mt-4 text-sm text-neutral-600">{t.historyText}</p>
      {error && <p className="mt-3 text-sm text-red-700">{error.message}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.kind}
            href={filter.kind === "all" ? "/officer/history" : `/officer/history?kind=${filter.kind}`}
            className={
              kind === filter.kind
                ? "btn"
                : "rounded-full border border-emerald-950/15 bg-white px-3 py-1.5 text-sm"
            }
          >
            {filter.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {history.map((record) => {
          const species = Array.isArray(record.species) ? record.species[0] : record.species;
          const botanist = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
          const reviewer = Array.isArray(record.reviewer) ? record.reviewer[0] : record.reviewer;
          const sentBack = record.status === "needs_revision" || record.status === "submitted";
          const showReason = record.status === "rejected" || sentBack;
          const noteLabel = record.status === "rejected" ? t.historyWhyRejected : t.historyWhatRequested;
          const who = reviewer?.name || reviewer?.id || t.unknownOfficer;
          return (
            <article key={record.uuid} className="surface flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{record.plant_name || species?.scientific_name || t.unidentified}</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {record.id}
                  {" · "}
                  {species?.common_name || t.noCommonName}
                  {" · "}
                  {botanist?.name || t.unknownBotanist}
                  {" · "}
                  {record.location_name || t.noPlaceName}
                  {" · "}
                  <StatusBadge status={record.status} />
                </p>
                {showReason && (
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    <p className="font-medium">{noteLabel}</p>
                    {record.status === "submitted" && (
                      <p className="mt-1 text-xs text-amber-800">{t.historyResubmitted}</p>
                    )}
                    <p className="mt-1 whitespace-pre-wrap">{record.review_note || t.noReviewNote}</p>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                <p className="font-medium">{who}</p>
                <p className="text-sm text-neutral-600">
                  {record.reviewed_at ? formatWhen(record.reviewed_at, locale) : t.historyTimeUnknown}
                </p>
                <Link
                  className="inline-flex items-center rounded border border-forest px-3 py-1 text-sm font-semibold text-forest"
                  href={`/officer/records/${record.uuid}?from=history`}
                >
                  {t.reviewFull}
                </Link>
              </div>
            </article>
          );
        })}
        {history.length === 0 && <p className="text-sm text-neutral-500">{t.historyEmpty}</p>}
      </div>
    </main>
  );
}
