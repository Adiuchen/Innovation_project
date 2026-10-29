import Link from "next/link";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { PageHeading } from "@/components/PageHeading";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { formatParkWhen } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { cancelEvent } from "./actions";

const FILTERS = ["all", "draft", "published", "cancelled"] as const;

export default async function OfficerEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const params = await searchParams;
  const status = FILTERS.includes(params.status as (typeof FILTERS)[number]) ? params.status! : "all";
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();

  let request = supabase
    .from("events")
    .select("uuid, id, title, location_name, starts_at, ends_at, status")
    .order("starts_at");
  if (status !== "all") request = request.eq("status", status);
  const { data, error } = await request;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading
        backHref="/dashboard"
        backLabel={t.backPage}
        title={t.events}
        extra={<Link className="btn" href="/officer/events/new">{t.addEvent}</Link>}
      />
      <p className="mt-4 text-sm text-neutral-600">{t.eventsIntro}</p>
      {(error || params.error) && (
        <p className="mt-3 text-sm text-red-700">{params.error || error?.message}</p>
      )}
      <form className="mt-4 flex flex-wrap gap-2" action="/officer/events">
        <select className="rounded border px-2 py-1" name="status" defaultValue={status}>
          <option value="all">{t.all}</option>
          <option value="draft">{t.draft}</option>
          <option value="published">{t.published}</option>
          <option value="cancelled">{t.cancelled}</option>
        </select>
        <button className="btn" type="submit">{t.filter}</button>
      </form>
      <ul className="mt-4 divide-y surface">
        {(data ?? []).map((item) => (
          <li key={item.uuid} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{item.id} · {item.title}</p>
              <p className="text-sm text-neutral-600">
                {formatParkWhen(item.starts_at, item.ends_at, locale)}
                {item.location_name ? ` · ${item.location_name}` : ""}
                {" · "}
                <StatusBadge status={item.status} />
              </p>
            </div>
            <div className="flex gap-2">
              <Link className="inline-flex items-center rounded border px-3 py-1 text-sm" href={`/officer/events/${item.uuid}`}>
                {t.edit}
              </Link>
              {item.status !== "cancelled" && (
                <ConfirmDelete
                  action={cancelEvent}
                  id={item.uuid}
                  next="/officer/events"
                  label={t.cancelEvent}
                  title={t.cancelEventTitle}
                  message={`${item.id} · ${item.title}. ${t.cancelEventText}`}
                  confirmLabel={t.confirm}
                  cancelLabel={t.cancel}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-800"
                />
              )}
            </div>
          </li>
        ))}
      </ul>
      {!error && (data ?? []).length === 0 && <p className="mt-4 text-sm text-neutral-500">{t.noEvents}</p>}
    </main>
  );
}
