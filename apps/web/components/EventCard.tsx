import Link from "next/link";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { StatusBadge } from "@/components/StatusBadge";
import { eventDisplayStatus, formatParkWhen } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n";

export type EventListItem = {
  uuid: string;
  id: string;
  title: string;
  location_name: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
};

export function EventCard({
  item,
  locale,
  t,
  next,
  cancelAction,
}: {
  item: EventListItem;
  locale: Locale;
  t: Copy;
  next: string;
  cancelAction: (formData: FormData) => void | Promise<void>;
}) {
  const shown = eventDisplayStatus(item.status, item.starts_at, item.ends_at);
  return (
    <article className="surface px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium">{item.id} · {item.title}</h2>
        <StatusBadge status={shown} />
      </div>
      <p className="mt-1 text-sm text-neutral-800">{formatParkWhen(item.starts_at, item.ends_at, locale)}</p>
      {item.location_name ? <p className="mt-1 text-sm text-neutral-600">{item.location_name}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-emerald-950/10 pt-3">
        <Link className="inline-flex h-9 items-center rounded-lg border border-emerald-950/15 bg-white px-3 text-sm font-semibold text-emerald-950" href={`/officer/events/${item.uuid}`}>
          {t.edit}
        </Link>
        {(shown === "draft" || shown === "published") && (
          <ConfirmDelete
            action={cancelAction}
            id={item.uuid}
            next={next}
            label={t.cancelEvent}
            title={t.cancelEventTitle}
            message={`${item.id} · ${item.title}. ${t.cancelEventText}`}
            confirmLabel={t.confirm}
            cancelLabel={t.cancel}
            className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-800"
          />
        )}
      </div>
    </article>
  );
}
