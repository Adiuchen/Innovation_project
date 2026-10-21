import { EventForm } from "@/components/EventForm";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { createEvent } from "../actions";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireUser(["conservation_officer"]);
  const { t } = await getCopy();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-8">
      <PageHeading backHref="/officer/events" backLabel={t.backPage} title={t.addEvent} />
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <EventForm action={createEvent} />
    </main>
  );
}
