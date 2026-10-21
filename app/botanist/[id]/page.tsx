import Link from "next/link";
import { notFound } from "next/navigation";
import { ChoiceField } from "@/components/ChoiceField";
import { PlantView } from "@/components/PlantView";
import { RecordTopic } from "@/components/RecordTopic";
import { SpeciesSelect } from "@/components/SpeciesSelect";
import { StatusBadge } from "@/components/StatusBadge";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { flowerOptions, healthLabels, healthOptions, leafOptions, lifeStageOptions, optionLabel } from "@/lib/field-choices";
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

  let qrImage: string | null = null;
  if (record.qr_code) {
    const headerStore = await headers();
    const host = headerStore.get("host") ?? "localhost:3000";
    const proto = headerStore.get("x-forwarded-proto") ?? "http";
    qrImage = await QRCode.toDataURL(`${proto}://${host}/p/${record.qr_code}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <RecordTopic
        backHref="/botanist"
        backLabel={t.backPage}
        title={record.plant_name || speciesName || t.unidentifiedPlant}
        subtitle={[record.plant_name ? speciesName : null, speciesInfo?.common_name, speciesInfo?.local_name].filter(Boolean).join(" · ")}
      >
        {speciesInfo?.conservation_status && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-forest">{speciesInfo.conservation_status}</span>
        )}
        {record.health_status && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">{optionLabel(record.health_status, healthLabels(t))}</span>
        )}
        <StatusBadge status={record.status} />
      </RecordTopic>
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
          showTitle={false}
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
      {qrImage && record.qr_code && (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImage} alt={t.qrCode} width={160} height={160} />
          <p className="text-sm">
            {t.publicPage}: <Link href={`/p/${record.qr_code}`}>/p/{record.qr_code}</Link>
          </p>
        </div>
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

