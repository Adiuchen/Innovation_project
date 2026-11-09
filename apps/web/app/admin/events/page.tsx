import { ConfirmDelete } from "@/components/ConfirmDelete";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { markExpiredEvents } from "@/lib/events";
import { eventDisplayStatus, formatParkWhen } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { takeDownEvent } from "./actions";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
  const { supabase } = await requireUser(["administrator"]);
  const { locale, t } = await getCopy();
  await markExpiredEvents(supabase);
  const { data, error } = await supabase
    .from("events")
    .select("uuid, id, title, location_name, starts_at, ends_at")
    .eq("status", "published")
    .order("starts_at");
  const current = (data ?? []).filter((item) => eventDisplayStatus("published", item.starts_at, item.ends_at) === "published");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/dashboard" backLabel={t.backPage} title={t.events} />
      <p className="mt-4 text-sm text-neutral-600">{t.adminEventsText}</p>
      {(error || actionError) && (
        <p className="mt-3 text-sm text-red-700">{actionError || error?.message}</p>
      )}
      <div className="mt-4 space-y-3">
        {current.map((item) => (
          <article key={item.uuid} className="surface px-5 py-4">
            <h2 className="font-medium">{item.id} · {item.title}</h2>
            <p className="mt-1 text-sm text-neutral-800">{formatParkWhen(item.starts_at, item.ends_at, locale)}</p>
            {item.location_name ? <p className="mt-1 text-sm text-neutral-600">{item.location_name}</p> : null}
            <div className="mt-4 flex justify-end border-t border-emerald-950/10 pt-3">
              <ConfirmDelete
                action={takeDownEvent}
                id={item.uuid}
                next="/admin/events"
                label={t.takeDown}
                title={t.takeDownTitle}
                message={`${item.id} · ${item.title}. ${t.takeDownText}`}
                confirmLabel={t.confirm}
                cancelLabel={t.cancel}
                className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-800"
              />
            </div>
          </article>
        ))}
      </div>
      {!error && current.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">{t.noPublishedEvents}</p>
      )}
    </main>
  );
}
