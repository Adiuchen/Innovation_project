import { notFound } from "next/navigation";
import { EventForm } from "@/components/EventForm";
import { PageHeading } from "@/components/PageHeading";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { updateEvent } from "../actions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!UUID_RE.test(id)) notFound();
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const fields = "uuid, id, title, description, location_name, starts_at, ends_at, status";
  const withPhoto = await supabase.from("events").select(`${fields}, image_path`).eq("uuid", id).maybeSingle();
  const event = withPhoto.error && /image_path/i.test(withPhoto.error.message)
    ? (await supabase.from("events").select(fields).eq("uuid", id).maybeSingle()).data
    : withPhoto.data;
  if (!event) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-8">
      <PageHeading backHref="/officer/events" backLabel={t.backPage} title={`${event.id} · ${t.editEvent}`} />
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <p className="mb-4 text-sm">
        {t.status}: <StatusBadge status={event.status} />
      </p>
      <EventForm
        action={updateEvent}
        event={{ ...event, imageUrl: "image_path" in event && event.image_path ? `/e/${event.id}/photo` : null }}
      />
    </main>
  );
}
