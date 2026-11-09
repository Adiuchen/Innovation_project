import type { Copy } from "@/lib/i18n";
import { numberOrNull, textOrNull } from "@/lib/format";

export function choiceFromForm(formData: FormData, name: string) {
  const selected = String(formData.get(name) ?? "").trim();
  if (!selected) return null;
  if (selected !== "other") return selected;
  const note = String(formData.get(`${name}_note`) ?? "").trim();
  return note || null;
}

/** Empty plant-registration fields for botanists. Returns the first problem, or null. */
export function plantRecordProblems(formData: FormData, options?: { requirePhoto?: boolean }) {
  if (!textOrNull(formData.get("plant_name"))) return "Enter a plant name.";

  const speciesId = String(formData.get("species_id") ?? "").trim();
  if (!speciesId) return "Choose a species.";
  if (speciesId === "new" && !textOrNull(formData.get("new_species_name"))) {
    return "Enter the new species name.";
  }

  if (!choiceFromForm(formData, "life_stage")) return "Choose a life stage.";
  if (!choiceFromForm(formData, "health_status")) return "Choose a health status.";
  if (!choiceFromForm(formData, "leaf_traits")) return "Choose leaf traits.";
  if (!choiceFromForm(formData, "flower_fruit_traits")) return "Choose flower or fruit traits.";
  if (!textOrNull(formData.get("other_traits"))) return "Enter other traits.";

  if (numberOrNull(formData.get("height_m")) == null) return "Enter height.";
  if (numberOrNull(formData.get("trunk_diameter_cm")) == null) return "Enter trunk diameter.";
  if (numberOrNull(formData.get("latitude")) == null) return "Enter latitude.";
  if (numberOrNull(formData.get("longitude")) == null) return "Enter longitude.";
  if (!textOrNull(formData.get("location_name"))) return "Enter a place name.";

  if (options?.requirePhoto) {
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) return "Add a photo.";
    if (!textOrNull(formData.get("photo_caption"))) return "Enter a photo caption.";
  }

  return null;
}

export function optionLabel(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) return null;
  return labels[value] ?? labels[value.toLowerCase()] ?? value;
}

function optionsFrom(labels: Record<string, string>, other: string) {
  return [...Object.entries(labels).map(([value, label]) => ({ value, label })), { value: "other", label: other }];
}

export function lifeStageLabels(t: Copy) {
  return {
    seedling: t.lifeStageSeedling,
    sapling: t.lifeStageSapling,
    mature: t.lifeStageMature,
    flowering: t.lifeStageFlowering,
    fruiting: t.lifeStageFruiting,
  };
}

export function healthLabels(t: Copy) {
  return {
    healthy: t.healthHealthy,
    fair: t.healthFair,
    poor: t.healthPoor,
    damaged: t.healthDamaged,
    diseased: t.healthDiseased,
    dead: t.healthDead,
    unknown: t.healthUnknown,
  };
}

export function leafLabels(t: Copy) {
  return {
    broad: t.leafBroad,
    narrow: t.leafNarrow,
    compound: t.leafCompound,
    not_visible: t.leafNotVisible,
  };
}

export function flowerLabels(t: Copy) {
  return {
    none: t.flowerNone,
    flowers: t.flowerFlowers,
    fruit: t.flowerFruitOnly,
    both: t.flowerBoth,
  };
}

export function lifeStageOptions(t: Copy) {
  return optionsFrom(lifeStageLabels(t), t.other);
}

export function healthOptions(t: Copy) {
  return optionsFrom(healthLabels(t), t.other);
}

export function leafOptions(t: Copy) {
  return optionsFrom(leafLabels(t), t.other);
}

export function flowerOptions(t: Copy) {
  return optionsFrom(flowerLabels(t), t.other);
}
