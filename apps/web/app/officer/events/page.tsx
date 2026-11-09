import Link from "next/link";
import { redirect } from "next/navigation";
import { EventCard, type EventListItem } from "@/components/EventCard";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { markExpiredEvents } from "@/lib/events";
import { eventDisplayStatus } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { cancelEvent } from "./actions";

const FILTERS = ["all", "draft", "published"] as const;

export default async function OfficerEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const params = await searchParams;
  if (params.status === "cancelled") redirect("/officer/events/history");
  const status = FILTERS.includes(params.status as (typeof FILTERS)[number]) ? params.status! : "all";
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();
  await markExpiredEvents(supabase);

  const { data, error } = await supabase
    .from("events")
    .select("uuid, id, title, location_name, starts_at, ends_at, status")
    .order("starts_at");

  const current = ((data ?? []) as EventListItem[]).filter((item) => {
    const shown = eventDisplayStatus(item.status, item.starts_at, item.ends_at);
    if (shown === "cancelled" || shown === "expired") return false;
    if (status === "all") return true;
    return item.status === status;
  });

  const filters = [
    { value: "all", label: t.all, href: "/officer/events" },
    { value: "draft", label: t.draft, href: "/officer/events?status=draft" },
    { value: "published", label: t.published, href: "/officer/events?status=published" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading
        backHref="/dashboard"
        backLabel={t.backPage}
        title={t.events}
        extra={
          <div className="flex flex-wrap items-center gap-3">
            <Link className="rounded-full border border-emerald-950/15 bg-white px-3 py-1.5 text-sm" href="/officer/events/history">{t.history}</Link>
            <Link className="btn" href="/officer/events/new">{t.addEvent}</Link>
          </div>
        }
      />
      <p className="mt-4 text-sm text-neutral-600">{t.eventsIntro}</p>
      {(error || params.error) && (
        <p className="mt-3 text-sm text-red-700">{params.error || error?.message}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.href}
            className={status === filter.value ? "btn" : "rounded-full border border-emerald-950/15 bg-white px-3 py-1.5 text-sm"}
          >
            {filter.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {current.map((item) => (
          <EventCard key={item.uuid} item={item} locale={locale} t={t} next="/officer/events" cancelAction={cancelEvent} />
        ))}
      </div>
      {!error && current.length === 0 && <p className="mt-4 text-sm text-neutral-500">{t.noEvents}</p>}
    </main>
  );
}
