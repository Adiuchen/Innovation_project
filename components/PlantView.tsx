import type { ReactNode } from "react";
import { PlantGallery } from "@/components/PlantGallery";
import { healthLabels, lifeStageLabels, optionLabel } from "@/lib/field-choices";
import type { Copy, Locale } from "@/lib/i18n";

export type PlantDetails = {
  plantName: string | null;
  lifeStage: string | null;
  scientificName: string | null;
  commonName: string | null;
  localName: string | null;
  family: string | null;
  genus: string | null;
  conservationStatus: string | null;
  plantId: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  heightM: number | null;
  health: string | null;
  recordedAt: string | null;
  recordedBy: string | null;
};

export async function PlantView({
  plant,
  photos,
  t,
  locale,
  showTitle = true,
}: {
  plant: PlantDetails;
  photos: { id: string; storage_path: string; caption: string | null }[];
  t: Copy;
  locale: Locale;
  showTitle?: boolean;
}) {
  const gallery = photos.map((photo) => ({
    id: photo.id,
    caption: photo.caption,
    src: `/photos/${photo.id}`,
  }));
  const title = plant.plantName || plant.scientificName || t.unidentifiedPlant;
  const names = [plant.plantName ? plant.scientificName : null, plant.commonName, plant.localName].filter(Boolean).join(" · ");
  const recorded = [formatWhen(plant.recordedAt, locale), plant.recordedBy].filter(Boolean).join(" · ");
  const mapUrl =
    plant.latitude != null && plant.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${plant.latitude}&mlon=${plant.longitude}#map=15/${plant.latitude}/${plant.longitude}`
      : null;

  return (
    <section>
      {showTitle && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {plant.conservationStatus && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-forest">{plant.conservationStatus}</span>
            )}
            {plant.health && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">{optionLabel(plant.health, healthLabels(t))}</span>
            )}
          </div>
          <h1 className={`mt-3 text-3xl font-semibold ${plant.plantName ? "" : "italic"}`}>{title}</h1>
          {names && <p className="mt-1 text-neutral-600">{names}</p>}
        </>
      )}

      <div className={`${showTitle ? "mt-6 " : ""}grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]`}>
        <PlantGallery photos={gallery} emptyLabel={t.noPhotos} fieldLabel={t.photographedInField} />
        <div className="space-y-4">
          <Card title={t.classification}>
            <Row label={t.family} value={plant.family} />
            <Row label={t.genus} value={plant.genus} />
            <Row label={t.scientificName} value={plant.scientificName} italic />
            <Row label={t.conservationStatus} value={plant.conservationStatus} />
          </Card>
          <Card title={t.thisSpecimen}>
            <Row label={t.plantName} value={plant.plantName} />
            <Row label={t.plantId} value={plant.plantId} />
            <Row label={t.lifeStage} value={optionLabel(plant.lifeStage, lifeStageLabels(t))} />
            <Row label={t.place} value={plant.location} />
            <div className="grid grid-cols-[8rem_1fr] gap-3 border-t border-neutral-100 py-2 text-sm">
              <dt className="text-neutral-500">{t.coordinates}</dt>
              <dd>
                {plant.latitude != null ? formatCoordinates(plant.latitude, plant.longitude) : "—"}
                {mapUrl && (
                  <a className="mt-1 block text-forest underline" href={mapUrl} target="_blank" rel="noreferrer">
                    {t.openMap}
                  </a>
                )}
              </dd>
            </div>
            <Row label={t.height} value={plant.heightM != null ? `${plant.heightM} m` : null} />
            <Row label={t.condition} value={optionLabel(plant.health, healthLabels(t))} />
            <Row label={t.recorded} value={recorded || null} />
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface px-4 py-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

function Row({ label, value, italic }: { label: string; value: string | null; italic?: boolean }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 border-t border-neutral-100 py-2 text-sm first:border-t-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={italic && value ? "italic" : undefined}>{value || "—"}</dd>
    </div>
  );
}

function formatCoordinates(latitude: number, longitude: number | null) {
  const north = latitude >= 0 ? "N" : "S";
  const east = (longitude ?? 0) >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(4)}° ${north}, ${Math.abs(longitude ?? 0).toFixed(4)}° ${east}`;
}

function formatWhen(value: string | null, locale: Locale) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "ms" ? "ms-MY" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

