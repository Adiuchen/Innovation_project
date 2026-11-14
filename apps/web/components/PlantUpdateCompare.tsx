import { flowerLabels, healthLabels, leafLabels, lifeStageLabels, optionLabel } from "@/lib/field-choices";
import type { Copy } from "@/lib/i18n";
import type { PlantDraft, UpdatePhoto } from "@/lib/plant-update";

type CompareRow = {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
  wide?: boolean;
  area?: boolean;
};

export function PlantUpdateCompare({
  before,
  after,
  currentPhotos,
  pendingPhotos,
  t,
}: {
  before: PlantDraft;
  after: PlantDraft;
  currentPhotos: UpdatePhoto[];
  pendingPhotos: UpdatePhoto[];
  t: Copy;
}) {
  const rows = formRows(before, after, t);
  const removed = new Set(after.hide_photo_ids);
  const beforePhotos = currentPhotos.map((photo) => ({
    ...photo,
    mark: removed.has(photo.id) ? ("remove" as const) : undefined,
  }));
  const afterPhotos = [
    ...currentPhotos.filter((photo) => !removed.has(photo.id)),
    ...pendingPhotos.map((photo) => ({ ...photo, mark: "new" as const })),
  ];
  const photosChanged = removed.size > 0 || pendingPhotos.length > 0;
  const changedCount = rows.filter((row) => row.changed).length + (photosChanged ? 1 : 0);

  return (
    <div>
      <p className="mt-1 text-sm text-neutral-600">{t.compareForms}</p>
      {changedCount > 0 && (
        <p className="mt-2 text-sm font-medium text-amber-900">{t.fieldsChanged.replace("{count}", String(changedCount))}</p>
      )}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <FormColumn title={t.beforeUpdate} rows={rows} side="before" photos={beforePhotos} photosChanged={photosChanged} t={t} />
        <FormColumn title={t.afterUpdate} rows={rows} side="after" photos={afterPhotos} photosChanged={photosChanged} t={t} />
      </div>
    </div>
  );
}

function FormColumn({
  title,
  rows,
  side,
  photos,
  photosChanged,
  t,
}: {
  title: string;
  rows: CompareRow[];
  side: "before" | "after";
  photos: (UpdatePhoto & { mark?: "remove" | "new" })[];
  photosChanged: boolean;
  t: Copy;
}) {
  return (
    <article className="surface min-w-0 px-4 py-4">
      <h4 className="text-lg font-semibold">{title}</h4>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <ReadField
            key={row.key}
            label={row.label}
            value={side === "before" ? row.before : row.after}
            changed={row.changed}
            showTag={side === "after" && row.changed}
            wide={row.wide}
            area={row.area}
            changedLabel={t.updateChanged}
          />
        ))}
      </div>
      <div className={`mt-3 rounded-lg border px-3 py-2 ${photosChanged ? "border-amber-300 bg-amber-50" : "border-emerald-950/10 bg-neutral-50"}`}>
        <p className="text-sm text-neutral-600">
          {t.savedPhoto}
          {side === "after" && photosChanged && <span className="ml-2 text-xs font-semibold text-amber-900">{t.updateChanged}</span>}
        </p>
        {photos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-400">—</p>
        ) : (
          <ul className="mt-2 flex gap-2 overflow-x-auto">
            {photos.map((photo) => (
              <li key={photo.id} className="w-24 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/photos/${photo.id}`} alt={photo.caption || ""} className="h-24 w-24 rounded-lg object-cover" />
                {photo.mark === "remove" && <p className="mt-1 text-xs text-red-800">{t.photoWillRemove}</p>}
                {photo.mark === "new" && <p className="mt-1 text-xs text-amber-900">{t.newPhotos}</p>}
                {photo.caption && !photo.mark && <p className="mt-1 truncate text-xs text-neutral-500">{photo.caption}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function ReadField({
  label,
  value,
  changed,
  showTag,
  wide,
  area,
  changedLabel,
}: {
  label: string;
  value: string;
  changed: boolean;
  showTag: boolean;
  wide?: boolean;
  area?: boolean;
  changedLabel: string;
}) {
  return (
    <div className={wide || area ? "col-span-2" : undefined}>
      <p className="text-sm text-neutral-600">
        {label}
        {showTag && <span className="ml-2 text-xs font-semibold text-amber-900">{changedLabel}</span>}
      </p>
      <div
        className={`mt-1 rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap ${area ? "min-h-24" : ""} ${
          changed ? "border-amber-300 bg-amber-50" : "border-emerald-950/10 bg-neutral-50"
        } ${value ? "text-neutral-900" : "text-neutral-400"}`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function formRows(before: PlantDraft, after: PlantDraft, t: Copy): CompareRow[] {
  const life = lifeStageLabels(t);
  const health = healthLabels(t);
  const leaf = leafLabels(t);
  const flower = flowerLabels(t);
  const specs: {
    key: string;
    label: string;
    read: (draft: PlantDraft) => string;
    wide?: boolean;
    area?: boolean;
  }[] = [
    { key: "plant_name", label: t.plantName, read: (draft) => text(draft.plant_name), wide: true },
    { key: "visibility", label: t.plantAccess, read: (draft) => (draft.visibility === "rare" ? t.rarePlant : t.ordinaryPlant), wide: true },
    { key: "scientific_name", label: t.scientificName, read: (draft) => text(draft.scientific_name || draft.new_species_name), wide: true },
    { key: "common_name", label: t.commonName, read: (draft) => text(draft.common_name) },
    { key: "local_name", label: t.localName, read: (draft) => text(draft.local_name) },
    { key: "family", label: t.family, read: (draft) => text(draft.family) },
    { key: "genus", label: t.genus, read: (draft) => text(draft.genus) },
    { key: "conservation_status", label: t.conservationStatus, read: (draft) => text(draft.conservation_status), wide: true },
    { key: "distribution", label: t.distribution, read: (draft) => text(draft.distribution), wide: true },
    { key: "description", label: t.description, read: (draft) => text(draft.description), wide: true, area: true },
    { key: "ecological_info", label: t.ecology, read: (draft) => text(draft.ecological_info), wide: true, area: true },
    { key: "cultural_significance", label: t.cultural, read: (draft) => text(draft.cultural_significance), wide: true, area: true },
    { key: "height_m", label: t.height, read: (draft) => withUnit(draft.height_m, "m") },
    { key: "trunk_diameter_cm", label: t.trunk, read: (draft) => withUnit(draft.trunk_diameter_cm, "cm") },
    { key: "latitude", label: t.latitude, read: (draft) => text(draft.latitude) },
    { key: "longitude", label: t.longitude, read: (draft) => text(draft.longitude) },
    { key: "location_name", label: t.placeName, read: (draft) => text(draft.location_name), wide: true },
    { key: "life_stage", label: t.lifeStage, read: (draft) => text(optionLabel(draft.life_stage, life)), wide: true },
    { key: "health_status", label: t.health, read: (draft) => text(optionLabel(draft.health_status, health)), wide: true },
    { key: "leaf_traits", label: t.leafTraits, read: (draft) => text(optionLabel(draft.leaf_traits, leaf)), wide: true },
    { key: "flower_fruit_traits", label: t.flowerFruit, read: (draft) => text(optionLabel(draft.flower_fruit_traits, flower)), wide: true },
    { key: "other_traits", label: t.otherTraits, read: (draft) => text(draft.other_traits), wide: true, area: true },
  ];

  return specs.map((spec) => {
    const left = spec.read(before);
    const right = spec.read(after);
    return {
      key: spec.key,
      label: spec.label,
      before: left,
      after: right,
      changed: !sameValue(left, right),
      wide: spec.wide,
      area: spec.area,
    };
  });
}

function text(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value).trim();
}

function withUnit(value: number | null, unit: string) {
  const raw = text(value);
  return raw ? `${raw} ${unit}` : "";
}

function sameValue(left: string, right: string) {
  if (left === right) return true;
  const leftNumber = Number(left.replace(/ (m|cm)$/, ""));
  const rightNumber = Number(right.replace(/ (m|cm)$/, ""));
  return left !== "" && right !== "" && Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber === rightNumber;
}
