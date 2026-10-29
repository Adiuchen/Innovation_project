import { EventCarousel } from "@/components/EventCarousel";
import { formatParkWhen } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function UpcomingEvents({ limit = 8 }: { limit?: number }) {
  const { locale, t } = await getCopy();
  const supabase = await createClient();
  const columns = "id, title, description, location_name, starts_at, ends_at";
  const withPhoto = await supabase.from("public_events").select(`${columns}, image_path`).order("starts_at").limit(limit);
  const result = withPhoto.error && /image_path/i.test(withPhoto.error.message)
    ? await supabase.from("public_events").select(columns).order("starts_at").limit(limit)
    : withPhoto;
  const { data, error } = result;

  const unavailable = error?.code === "PGRST205" || /public_events|schema cache/i.test(error?.message ?? "");

  if (error || (data ?? []).length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t.upcomingEvents}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t.upcomingEventsHint}</p>
        {error ? (
          <p className="mt-3 text-sm text-red-700">{unavailable ? t.eventsUnavailable : error.message}</p>
        ) : (
          <p className="surface mt-4 px-5 py-6 text-sm text-neutral-500">{t.noUpcomingEvents}</p>
        )}
      </section>
    );
  }

  return (
    <EventCarousel
      label={t.upcomingEvents}
      viewLabel={t.viewEvent}
      slides={(data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        when: formatParkWhen(item.starts_at, item.ends_at, locale),
        location: item.location_name,
        description: item.description,
        image: "image_path" in item && item.image_path ? `/e/${item.id}/photo` : null,
      }))}
    />
  );
}
