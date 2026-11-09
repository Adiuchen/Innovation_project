import type { Copy } from "@/lib/i18n";

const tones = ["approved", "needs_revision", "rejected"] as const;

export type ReviewTone = (typeof tones)[number];

export function reviewNotice(done: string | undefined, plant: string | undefined, t: Copy) {
  if (!done || !tones.includes(done as ReviewTone)) return null;
  const tone = done as ReviewTone;
  const id = plant && /^[A-Za-z0-9_-]{1,24}$/.test(plant) ? plant : "";
  const template =
    tone === "approved" ? t.reviewDoneApproved : tone === "rejected" ? t.reviewDoneRejected : t.reviewDoneChanges;
  const message = id
    ? template.replace("{id}", id)
    : tone === "approved"
      ? t.approved
      : tone === "rejected"
        ? t.rejected
        : t.changesRequested;
  return { tone, message };
}
