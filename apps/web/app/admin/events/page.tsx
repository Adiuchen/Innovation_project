import { ConfirmDelete } from "@/components/ConfirmDelete";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { formatParkWhen } from "@/lib/format";
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
  const { data, error } = await supabase
    .from("events")
    .select("uuid, id, title, location_name, starts_at, ends_at")
    .eq("status", "published")
    .order("starts_at");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/dashboard" backLabel={t.backPage} title={t.events} />
      <p className="mt-4 text-sm text-neutral-600">{t.adminEventsText}</p>
      {(error || actionError) && (
        <p className="mt-3 text-sm text-red-700">{actionError || error?.message}</p>
      )}
      <ul className="mt-4 divide-y surface">
        {(data ?? []).map((item) => (
          <li key={item.uuid} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{item.id} · {item.title}</p>
              <p className="text-sm text-neutral-600">
                {formatParkWhen(item.starts_at, item.ends_at, locale)}
                {item.location_name ? ` · ${item.location_name}` : ""}
              </p>
            </div>
            <ConfirmDelete
              action={takeDownEvent}
              id={item.uuid}
              next="/admin/events"
              label={t.takeDown}
              title={t.takeDownTitle}
              message={`${item.id} · ${item.title}. ${t.takeDownText}`}
              confirmLabel={t.confirm}
              cancelLabel={t.cancel}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-800"
            />
          </li>
        ))}
      </ul>
      {!error && (data ?? []).length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">{t.noPublishedEvents}</p>
      )}
    </main>
  );
}
