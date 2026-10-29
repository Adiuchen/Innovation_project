import { notFound } from "next/navigation";
import { BackPage } from "@/components/BackPage";
import { ChoiceField } from "@/components/ChoiceField";
import { PlantView } from "@/components/PlantView";
import { SpeciesSelect } from "@/components/SpeciesSelect";
import { StatusBadge } from "@/components/StatusBadge";
import { StickyBar } from "@/components/StickyBar";
import { requireUser } from "@/lib/auth";
import { flowerOptions, healthOptions, leafOptions, lifeStageOptions } from "@/lib/field-choices";
import { getCopy } from "@/lib/i18n";
import { addRecordPhoto, generateQr, resubmit } from "../actions";

export default async function RecordDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, user } = await requireUser(["botanist"]);
  const { locale, t } = await getCopy();
  const { data: record } = await supabase
    .from("plant_records")
    .select("*, species(scientific_name, common_name, local_name, family, genus, conservation_status), profiles!plant_records_botanist_id_fkey(name)")
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .maybeSingle();

  if (!record) notFound();

  const { data: species } = await supabase
    .from("species")
    .select("uuid, id, scientific_name")
    .is("hidden_at", null)
    .order("scientific_name");
  const { data: photos } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("plant_record_id", record.uuid)
    .is("hidden_at", null);
  const speciesInfo = Array.isArray(record.species) ? record.species[0] : record.species;
  const botanist = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
  const speciesName = speciesInfo?.scientific_name;
  const editable = record.status === "draft" || record.status === "needs_revision" || record.status === "rejected";
  const sentBack = record.status === "needs_revision" || record.status === "rejected";
  const canAddPhoto = editable || record.status === "submitted";

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <StickyBar>
        <div className="flex items-center gap-3">
          <BackPage href="/botanist" label={t.backPage} />
          <StatusBadge status={record.status} />
        </div>
      </StickyBar>
      {sentBack && (
        <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm">
          {record.status === "rejected" ? t.noticeRejected : t.noticeRevision}
        </p>
      )}
      {record.review_note && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm">{t.officerNote}: {record.review_note}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4">
        <PlantView
          locale={locale}
          t={t}
          qrCode={record.qr_code}
          photos={photos ?? []}
          plant={{
            plantName: record.plant_name,
            lifeStage: record.life_stage,
            scientificName: speciesName ?? null,
            commonName: speciesInfo?.common_name ?? null,
            localName: speciesInfo?.local_name ?? null,
            family: speciesInfo?.family ?? null,
            genus: speciesInfo?.genus ?? null,
            conservationStatus: speciesInfo?.conservation_status ?? null,
            plantId: record.id,
            location: record.location_name,
            latitude: record.latitude,
            longitude: record.longitude,
            heightM: record.height_m,
            health: record.health_status,
            recordedAt: record.recorded_at,
            recordedBy: botanist?.name ?? null,
          }}
        />
      </div>
      {canAddPhoto && (
        <form action={addRecordPhoto} className="surface mt-4 space-y-2 p-4">
          <input type="hidden" name="id" value={record.uuid} />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" capture="environment" />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" name="photo_caption" placeholder={t.photoCaption} />
          <button className="btn" type="submit">{t.addPhoto}</button>
        </form>
      )}

      {editable && (
        <form action={resubmit} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={record.uuid} />
          <Input name="plant_name" label={t.plantName} defaultValue={record.plant_name} required />
          <SpeciesSelect t={t} species={species ?? []} defaultValue={record.species_id ?? ""} compact />
          <div className="grid grid-cols-2 gap-3">
            <Input name="height_m" label={t.height} defaultValue={record.height_m} />
            <Input name="trunk_diameter_cm" label={t.trunk} defaultValue={record.trunk_diameter_cm} />
            <Input name="latitude" label={t.latitude} defaultValue={record.latitude} />
            <Input name="longitude" label={t.longitude} defaultValue={record.longitude} />
          </div>
          <Input name="location_name" label={t.placeName} defaultValue={record.location_name} />
          <ChoiceField name="life_stage" label={t.lifeStage} options={lifeStageOptions(t)} value={record.life_stage} otherLabel={t.otherDetail} />
          <ChoiceField name="health_status" label={t.health} options={healthOptions(t)} value={record.health_status} otherLabel={t.otherDetail} />
          <ChoiceField name="leaf_traits" label={t.leafTraits} options={leafOptions(t)} value={record.leaf_traits} otherLabel={t.otherDetail} />
          <ChoiceField name="flower_fruit_traits" label={t.flowerFruit} options={flowerOptions(t)} value={record.flower_fruit_traits} otherLabel={t.otherDetail} />
          <Input name="other_traits" label={t.otherTraits} defaultValue={record.other_traits} />
          <button className="btn" type="submit">{t.submitAgain}</button>
        </form>
      )}

      {record.status === "approved" && !record.qr_code && (
        <form action={generateQr} className="mt-4">
          <input type="hidden" name="id" value={record.uuid} />
          <button className="btn" type="submit">{t.generateQr}</button>
        </form>
      )}
    </main>
  );
}

function Input({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string | number | null; required?: boolean }) {
  return (
    <label className="block text-sm">
      {label}
      <input className="mt-1 w-full rounded-lg border px-3 py-2" name={name} defaultValue={defaultValue ?? ""} required={required} />
    </label>
  );
}

