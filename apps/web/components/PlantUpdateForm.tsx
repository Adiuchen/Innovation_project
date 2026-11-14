"use client";

import { useState } from "react";
import { ChoiceField } from "@/components/ChoiceField";
import { flowerOptions, healthOptions, leafOptions, lifeStageOptions } from "@/lib/field-choices";
import type { Copy } from "@/lib/i18n";
import type { PlantDraft, SpeciesChoice, UpdatePhoto } from "@/lib/plant-update";

type SpeciesText = {
  scientific_name: string;
  common_name: string;
  local_name: string;
  family: string;
  genus: string;
  description: string;
  conservation_status: string;
  distribution: string;
  ecological_info: string;
  cultural_significance: string;
};

function textFrom(draft: PlantDraft): SpeciesText {
  return {
    scientific_name: draft.scientific_name ?? "",
    common_name: draft.common_name ?? "",
    local_name: draft.local_name ?? "",
    family: draft.family ?? "",
    genus: draft.genus ?? "",
    description: draft.description ?? "",
    conservation_status: draft.conservation_status ?? "",
    distribution: draft.distribution ?? "",
    ecological_info: draft.ecological_info ?? "",
    cultural_significance: draft.cultural_significance ?? "",
  };
}

function textFromSpecies(species: SpeciesChoice): SpeciesText {
  return {
    scientific_name: species.scientific_name ?? "",
    common_name: species.common_name ?? "",
    local_name: species.local_name ?? "",
    family: species.family ?? "",
    genus: species.genus ?? "",
    description: species.description ?? "",
    conservation_status: species.conservation_status ?? "",
    distribution: species.distribution ?? "",
    ecological_info: species.ecological_info ?? "",
    cultural_significance: species.cultural_significance ?? "",
  };
}

const emptyText: SpeciesText = {
  scientific_name: "",
  common_name: "",
  local_name: "",
  family: "",
  genus: "",
  description: "",
  conservation_status: "",
  distribution: "",
  ecological_info: "",
  cultural_significance: "",
};

export function PlantUpdateForm({
  action,
  mode,
  plantId,
  updateId,
  draft,
  species,
  photos,
  t,
}: {
  action: (formData: FormData) => void | Promise<void>;
  mode: "officer" | "botanist";
  plantId?: string;
  updateId?: string;
  draft: PlantDraft;
  species: SpeciesChoice[];
  photos: UpdatePhoto[];
  t: Copy;
}) {
  const [speciesId, setSpeciesId] = useState(draft.species_id ?? "");
  const [details, setDetails] = useState<SpeciesText>(textFrom(draft));

  function chooseSpecies(id: string) {
    setSpeciesId(id);
    if (!id || id === "new") {
      setDetails(emptyText);
      return;
    }
    const found = species.find((item) => item.uuid === id);
    setDetails(found ? textFromSpecies(found) : emptyText);
  }

  return (
    <form action={action} className="mt-4 space-y-3">
      {plantId && <input type="hidden" name="plant_id" value={plantId} />}
      {updateId && <input type="hidden" name="update_id" value={updateId} />}
      <p className="text-sm text-neutral-600">{t.samePlantNote}</p>
      <p className="text-sm text-neutral-600">{t.speciesSharedHint}</p>
      <Field name="plant_name" label={t.plantName} defaultValue={draft.plant_name} required />
      <label className="block text-sm">
        {t.plantAccess}
        <select className="mt-1 w-full rounded-lg border px-3 py-2" name="visibility" defaultValue={draft.visibility}>
          <option value="ordinary">{t.ordinaryPlant}</option>
          <option value="rare">{t.rarePlant}</option>
        </select>
        <span className="mt-1 block text-neutral-500">{t.plantAccessHint}</span>
      </label>
      <label className="block text-sm">
        {t.identifiedSpecies}
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          name="species_id"
          value={speciesId}
          required
          onChange={(event) => chooseSpecies(event.target.value)}
        >
          <option value="">—</option>
          <option value="new">{t.newSpecies}</option>
          {species.map((item) => (
            <option key={item.uuid} value={item.uuid}>
              {item.id} · {item.scientific_name}
              {item.common_name ? ` (${item.common_name})` : ""}
            </option>
          ))}
        </select>
      </label>
      <Field name="scientific_name" label={t.scientificName} value={details.scientific_name} onChange={(value) => setDetails({ ...details, scientific_name: value })} required />
      <div className="grid grid-cols-2 gap-3">
        <Field name="common_name" label={t.commonName} value={details.common_name} onChange={(value) => setDetails({ ...details, common_name: value })} />
        <Field name="local_name" label={t.localName} value={details.local_name} onChange={(value) => setDetails({ ...details, local_name: value })} />
        <Field name="family" label={t.family} value={details.family} onChange={(value) => setDetails({ ...details, family: value })} />
        <Field name="genus" label={t.genus} value={details.genus} onChange={(value) => setDetails({ ...details, genus: value })} />
      </div>
      <Field name="conservation_status" label={t.conservationStatus} value={details.conservation_status} onChange={(value) => setDetails({ ...details, conservation_status: value })} />
      <Field name="distribution" label={t.distribution} value={details.distribution} onChange={(value) => setDetails({ ...details, distribution: value })} />
      <Field name="description" label={t.description} value={details.description} onChange={(value) => setDetails({ ...details, description: value })} area />
      <Field name="ecological_info" label={t.ecology} value={details.ecological_info} onChange={(value) => setDetails({ ...details, ecological_info: value })} area />
      <Field name="cultural_significance" label={t.cultural} value={details.cultural_significance} onChange={(value) => setDetails({ ...details, cultural_significance: value })} area />
      <div className="grid grid-cols-2 gap-3">
        <Field name="height_m" label={t.height} defaultValue={draft.height_m} required />
        <Field name="trunk_diameter_cm" label={t.trunk} defaultValue={draft.trunk_diameter_cm} required />
        <Field name="latitude" label={t.latitude} defaultValue={draft.latitude} required />
        <Field name="longitude" label={t.longitude} defaultValue={draft.longitude} required />
      </div>
      <Field name="location_name" label={t.placeName} defaultValue={draft.location_name} required />
      <ChoiceField name="life_stage" label={t.lifeStage} options={lifeStageOptions(t)} value={draft.life_stage} otherLabel={t.otherDetail} required />
      <ChoiceField name="health_status" label={t.health} options={healthOptions(t)} value={draft.health_status} otherLabel={t.otherDetail} required />
      <ChoiceField name="leaf_traits" label={t.leafTraits} options={leafOptions(t)} value={draft.leaf_traits} otherLabel={t.otherDetail} required />
      <ChoiceField name="flower_fruit_traits" label={t.flowerFruit} options={flowerOptions(t)} value={draft.flower_fruit_traits} otherLabel={t.otherDetail} required />
      <Field name="other_traits" label={t.otherTraits} defaultValue={draft.other_traits} required />
      {photos.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{t.savedPhoto}</legend>
          {photos.map((photo) => (
            <label key={photo.id} className="surface block p-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/photos/${photo.id}`} alt={photo.caption || ""} className="mb-2 max-h-48 rounded-lg object-cover" />
              {photo.caption && <span className="mb-2 block text-neutral-600">{photo.caption}</span>}
              <span className="inline-flex items-center gap-2">
                <input type="checkbox" name="hide_photo" value={photo.id} />
                {mode === "botanist" ? t.dropPhotoLater : t.hidePhoto}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="block text-sm">
        {t.addPhoto}
        <input className="mt-1 w-full rounded-lg border px-3 py-2" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" />
        <span className="mt-1 block text-neutral-500">{mode === "botanist" ? t.pendingPhoto : t.photoHint}</span>
      </label>
      <Field name="photo_caption" label={t.photoCaption} />
      {mode === "officer" ? (
        <button className="btn" type="submit" name="intent" value="save">{t.save}</button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-semibold" type="submit" name="intent" value="draft" formNoValidate>{t.saveUpdateDraft}</button>
          <button className="btn" type="submit" name="intent" value="submit">{t.submitUpdate}</button>
        </div>
      )}
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  value,
  onChange,
  required,
  area = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  area?: boolean;
}) {
  const className = "mt-1 w-full rounded-lg border px-3 py-2";
  return (
    <label className="block text-sm">
      {label}
      {area ? (
        <textarea
          className={className}
          name={name}
          rows={4}
          required={required}
          {...(onChange ? { value: value ?? "", onChange: (event) => onChange(event.target.value) } : { defaultValue: defaultValue ?? "" })}
        />
      ) : (
        <input
          className={className}
          name={name}
          required={required}
          {...(onChange ? { value: value ?? "", onChange: (event) => onChange(event.target.value) } : { defaultValue: defaultValue ?? "" })}
        />
      )}
    </label>
  );
}
