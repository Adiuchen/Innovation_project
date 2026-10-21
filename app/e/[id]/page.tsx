import { notFound } from "next/navigation";
import { BackPage } from "@/components/BackPage";
import { formatParkWhen, parkStartParts } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^E\d{1,6}$/.test(id)) notFound();

  const supabase = await createClient();
  const fields = "id, title, description, location_name, starts_at, ends_at";
  const withPhoto = await supabase.from("public_events").select(`${fields}, image_path`).eq("id", id).maybeSingle();
  const event = withPhoto.error && /image_path/i.test(withPhoto.error.message)
    ? (await supabase.from("public_events").select(fields).eq("id", id).maybeSingle()).data
    : withPhoto.data;
  if (!event) notFound();

  const { locale, t } = await getCopy();
  const when = formatParkWhen(event.starts_at, event.ends_at, locale);
  const start = parkStartParts(event.starts_at, locale);
  const hasPhoto = "image_path" in event && Boolean(event.image_path);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      <BackPage href="/" label={t.backPage} />
      {hasPhoto && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/e/${event.id}/photo`}
          alt=""
          className="mt-4 h-72 w-full rounded-3xl object-cover sm:h-96"
        />
      )}
      <p className={`text-sm font-medium text-forest ${hasPhoto ? "mt-6" : "mt-5"}`}>{t.upcomingEvents}</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight">{event.title}</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <article className="surface flex items-center gap-4 px-4 py-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-forest text-white">
            <span className="text-[11px] font-semibold uppercase tracking-wide">{start.month}</span>
            <span className="text-xl font-semibold leading-none">{start.day}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t.eventWhen}</p>
            <p className="mt-1 font-medium">{start.weekday}</p>
            <p className="mt-0.5 text-sm text-neutral-600">{when}</p>
          </div>
        </article>
        {event.location_name && (
          <article className="surface flex flex-col justify-center px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t.place}</p>
            <p className="mt-2 text-lg font-medium">{event.location_name}</p>
          </article>
        )}
      </div>
      {event.description && (
        <section className="surface mt-3 px-5 py-5">
          <h2 className="text-sm font-semibold">{t.eventAbout}</h2>
          <p className="mt-3 whitespace-pre-wrap text-base leading-7">{event.description}</p>
        </section>
      )}
    </main>
  );
}
