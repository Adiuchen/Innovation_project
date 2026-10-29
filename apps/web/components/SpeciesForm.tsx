import { PhotoList } from "@/components/PhotoList";
import { hideSpeciesPhoto, updateSpeciesPhoto } from "@/app/officer/actions";
import { getCopy } from "@/lib/i18n";

export async function SpeciesForm({
  action,
  species,
  photos = [],
}: {
  action: (formData: FormData) => void | Promise<void>;
  species?: {
    uuid: string;
    id: string;
    scientific_name: string;
    common_name: string | null;
    local_name: string | null;
    family: string | null;
    genus: string | null;
    description: string | null;
    conservation_status: string | null;
    distribution: string | null;
    ecological_info: string | null;
    cultural_significance: string | null;
  };
  photos?: { id: string; storage_path: string; caption: string | null }[];
}) {
  const { t } = await getCopy();
  return (
    <>
    {(photos ?? []).length > 0 && (
      <div className="mb-6 space-y-4">
        <p className="text-sm font-medium">{t.savedPhoto}</p>
        {(photos ?? []).map((photo) => (
          <article key={photo.id} className="surface p-3">
            <PhotoList photos={[photo]} />
            <form action={updateSpeciesPhoto} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={photo.id} />
              <input type="hidden" name="species_id" value={species?.uuid ?? ""} />
              <label className="block min-w-48 flex-1 text-sm">
                {t.photoCaption}
                <input className="mt-1 w-full rounded-lg border px-3 py-2" name="caption" defaultValue={photo.caption ?? ""} />
              </label>
              <button className="rounded border px-3 py-2 text-sm" type="submit">{t.saveCaption}</button>
            </form>
            <form action={hideSpeciesPhoto} className="mt-2">
              <input type="hidden" name="id" value={photo.id} />
              <input type="hidden" name="species_id" value={species?.uuid ?? ""} />
              <button className="text-sm text-red-700" type="submit">{t.hidePhoto}</button>
            </form>
          </article>
        ))}
      </div>
    )}
    <form action={action} className="space-y-3">
      {species && <input type="hidden" name="id" value={species.uuid} />}
      <Field name="scientific_name" label={t.scientificName} required defaultValue={species?.scientific_name} />
      <Field name="common_name" label={t.commonName} defaultValue={species?.common_name} />
      <Field name="local_name" label={t.localName} defaultValue={species?.local_name} />
      <div className="grid grid-cols-2 gap-3">
        <Field name="family" label={t.family} defaultValue={species?.family} />
        <Field name="genus" label={t.genus} defaultValue={species?.genus} />
      </div>
      <Field name="conservation_status" label={t.conservationStatus} defaultValue={species?.conservation_status} />
      <Field name="distribution" label={t.distribution} defaultValue={species?.distribution} />
      <Field name="description" label={t.description} area defaultValue={species?.description} />
      <Field name="ecological_info" label={t.ecology} area defaultValue={species?.ecological_info} />
      <Field name="cultural_significance" label={t.cultural} area defaultValue={species?.cultural_significance} />
      <label className="block text-sm">
        {t.referencePhoto}
        <input className="mt-1 w-full rounded-lg border px-3 py-2" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" />
        <span className="mt-1 block text-neutral-500">{t.photoHint}</span>
      </label>
      <Field name="photo_caption" label={t.photoCaption} />
      <button className="btn" type="submit">{t.save}</button>
    </form>
    </>
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
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" name={name} rows={3} defaultValue={defaultValue ?? ""} />
      ) : (
        <input className="mt-1 w-full rounded-lg border px-3 py-2" name={name} required={required} defaultValue={defaultValue ?? ""} />
      )}
    </label>
  );
}
