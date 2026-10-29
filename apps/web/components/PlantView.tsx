import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { PlantGallery } from "@/components/PlantGallery";
import { PrintQrButton } from "@/components/PrintQrButton";
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
  qrCode,
}: {
  plant: PlantDetails;
  photos: { id: string; storage_path: string; caption: string | null }[];
  t: Copy;
  locale: Locale;
  qrCode?: string | null;
}) {
  const gallery = photos.map((photo) => ({
    id: photo.id,
    caption: photo.caption,
    src: `/photos/${photo.id}`,
  }));
  const title = plant.plantName || plant.scientificName || t.unidentifiedPlant;
  const scientificLine = plant.plantName && plant.scientificName ? plant.scientificName : null;
  const commons = [plant.commonName, plant.localName].filter(Boolean).join(" · ");
  const recorded = [formatWhen(plant.recordedAt, locale), plant.recordedBy].filter(Boolean).join(" · ");
  const mapUrl =
    plant.latitude != null && plant.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${plant.latitude}&mlon=${plant.longitude}#map=15/${plant.latitude}/${plant.longitude}`
      : null;
  const health = optionLabel(plant.health, healthLabels(t));
  const qr = qrCode ? await plantQr(qrCode) : null;

  return (
    <section className="grid items-stretch gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <PlantGallery photos={gallery} emptyLabel={t.noPhotos} qrSrc={qr?.image} qrAlt={t.qrCode} />
        {qr && qrCode && (
          <div>
            <p className="text-sm">
              {t.publicPage}: <Link href={qr.path}>{qr.path}</Link>
            </p>
            <PrintQrButton
              qrCode={qrCode}
              label={t.printQr}
              printingLabel={t.printingQr}
              successLabel={t.qrPrinted}
              failedLabel={t.qrPrintFailed}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/5 sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          {plant.conservationStatus && (
            <span className="rounded-full bg-[#f3e4dc] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#7a3b2e]">{plant.conservationStatus}</span>
          )}
          {health && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-forest">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {health}
            </span>
          )}
        </div>
        <h1 className={`mt-4 text-5xl font-semibold tracking-tight ${plant.plantName ? "" : "italic"}`}>{title}</h1>
        {scientificLine && <p className="mt-2 font-serif text-2xl text-neutral-700 italic">{scientificLine}</p>}
        {commons && <p className="mt-1 text-sm text-neutral-500">{commons}</p>}

        <div className="mt-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">{t.classification}</h2>
            <dl className="mt-1">
              <Fact label={t.family} value={plant.family} />
              <Fact label={t.genus} value={plant.genus} />
              <Fact label={t.scientificName} value={plant.scientificName} italic />
              <Fact label={t.conservationStatus} value={plant.conservationStatus} />
            </dl>
          </div>
          <div>
            <h2 className="text-sm font-semibold">{t.thisSpecimen}</h2>
            <dl className="mt-1">
              <Fact label={t.plantName} value={plant.plantName} />
              <Fact label={t.plantId} value={plant.plantId} />
              <Fact label={t.lifeStage} value={optionLabel(plant.lifeStage, lifeStageLabels(t))} />
              <Fact label={t.place} value={plant.location} />
              <Fact label={t.coordinates} value={plant.latitude != null ? formatCoordinates(plant.latitude, plant.longitude) : null} mapUrl={mapUrl} mapLabel={t.openMap} />
              <Fact label={t.height} value={plant.heightM != null ? `${plant.heightM} m` : null} />
              <Fact label={t.condition} value={health} />
              <Fact label={t.recorded} value={recorded || null} />
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({
  label,
  value,
  italic = false,
  mapUrl,
  mapLabel,
}: {
  label: string;
  value: string | null;
  italic?: boolean;
  mapUrl?: string | null;
  mapLabel?: string;
}) {
  return (
    <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-3 border-t border-neutral-100 py-2.5 text-sm first:border-t-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="min-w-0">
        <span className={italic && value ? "italic" : undefined}>{value || "—"}</span>
        {mapUrl && mapLabel && (
          <a className="mt-1 block font-medium text-forest underline" href={mapUrl} target="_blank" rel="noreferrer">
            {mapLabel}
          </a>
        )}
      </dd>
    </div>
  );
}

async function plantQr(qrCode: string) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const pageUrl = `${proto}://${host}/p/${qrCode}`;
  const image = await QRCode.toDataURL(pageUrl);
  return { image, path: `/p/${qrCode}` };
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
