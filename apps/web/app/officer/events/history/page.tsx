import { EventCard, type EventListItem } from "@/components/EventCard";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { markExpiredEvents } from "@/lib/events";
import { eventDisplayStatus } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { cancelEvent } from "../actions";

export default async function OfficerEventHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();
  await markExpiredEvents(supabase);
  const { data, error } = await supabase
    .from("events")
    .select("uuid, id, title, location_name, starts_at, ends_at, status")
    .order("starts_at", { ascending: false });

  const past = ((data ?? []) as EventListItem[]).filter(
    (item) => {
      const shown = eventDisplayStatus(item.status, item.starts_at, item.ends_at);
      return shown === "cancelled" || shown === "expired";
    },
  );

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/officer/events" backLabel={t.backPage} title={t.history} />
      <p className="mt-4 text-sm text-neutral-600">{t.eventHistoryText}</p>
      {(error || actionError) && (
        <p className="mt-3 text-sm text-red-700">{actionError || error?.message}</p>
      )}
      <div className="mt-4 space-y-3">
        {past.map((item) => (
          <EventCard key={item.uuid} item={item} locale={locale} t={t} next="/officer/events/history" cancelAction={cancelEvent} />
        ))}
      </div>
      {!error && past.length === 0 && <p className="mt-4 text-sm text-neutral-500">{t.eventHistoryEmpty}</p>}
    </main>
  );
}
