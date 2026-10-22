const tones: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-900",
  published: "bg-emerald-100 text-emerald-900",
  active: "bg-emerald-100 text-emerald-900",
  online: "bg-emerald-100 text-emerald-900",
  resolved: "bg-emerald-100 text-emerald-900",
  submitted: "bg-amber-100 text-amber-900",
  open: "bg-amber-100 text-amber-900",
  acknowledged: "bg-sky-100 text-sky-900",
  needs_revision: "bg-orange-100 text-orange-900",
  draft: "bg-neutral-100 text-neutral-700",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
  suspended: "bg-red-100 text-red-800",
  offline: "bg-red-100 text-red-800",
  possible_theft: "bg-red-100 text-red-800",
  sensor_offline: "bg-red-100 text-red-800",
  dry_condition: "bg-orange-100 text-orange-900",
  high_temperature: "bg-orange-100 text-orange-900",
  possible_disturbance: "bg-orange-100 text-orange-900",
};

export function statusTone(status: string) {
  return tones[status] ?? "bg-neutral-100 text-neutral-700";
}
