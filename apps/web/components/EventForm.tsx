import { EventSubmitButtons } from "@/components/EventSubmitButtons";
import { OnceForm } from "@/components/OnceForm";
import { parkDateTimeLocal } from "@/lib/format";
import { getCopy } from "@/lib/i18n";

export async function EventForm({
  action,
  event,
}: {
  action: (formData: FormData) => void | Promise<void>;
  event?: {
    uuid: string;
    title: string;
    description: string | null;
    location_name: string | null;
    starts_at: string;
    ends_at: string | null;
    imageUrl?: string | null;
  };
}) {
  const { t } = await getCopy();

  return (
    <OnceForm action={action} className="space-y-3">
      {event && <input type="hidden" name="id" value={event.uuid} />}
      <Field name="title" label={t.eventTitle} required defaultValue={event?.title} />
      <Field name="location_name" label={t.place} defaultValue={event?.location_name} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          {t.eventStarts}
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={parkDateTimeLocal(event?.starts_at)}
          />
        </label>
        <label className="block text-sm">
          {t.eventEnds}
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="ends_at"
            type="datetime-local"
            defaultValue={parkDateTimeLocal(event?.ends_at)}
          />
        </label>
      </div>
      <p className="text-sm text-neutral-500">{t.eventEndsHint} {t.parkTimeHint}</p>
      <Field name="description" label={t.description} area defaultValue={event?.description} />
      <label className="block text-sm">
        {t.eventPhoto}
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        />
        <span className="mt-1 block text-neutral-500">{t.photoHint}</span>
      </label>
      {event?.imageUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.imageUrl} alt="" className="h-36 w-full rounded-lg object-cover" />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input name="remove_photo" type="checkbox" />
            {t.removeEventPhoto}
          </label>
        </div>
      )}
      <EventSubmitButtons saveDraft={t.saveDraft} publish={t.publish} saving={t.saving} />
    </OnceForm>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  area,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  area?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      {area ? (
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" name={name} rows={4} defaultValue={defaultValue ?? ""} />
      ) : (
        <input className="mt-1 w-full rounded-lg border px-3 py-2" name={name} required={required} defaultValue={defaultValue ?? ""} />
      )}
    </label>
  );
}
