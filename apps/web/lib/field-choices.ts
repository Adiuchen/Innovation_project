import type { Copy } from "@/lib/i18n";

export function choiceFromForm(formData: FormData, name: string) {
  const selected = String(formData.get(name) ?? "").trim();
  if (!selected) return null;
  if (selected !== "other") return selected;
  const note = String(formData.get(`${name}_note`) ?? "").trim();
  return note || null;
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
