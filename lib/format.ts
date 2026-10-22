export function numberOrNull(value: FormDataEntryValue | string | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isGmailAddress(email: string) {
  return /^[^\s@]+@gmail\.com$/.test(email.trim().toLowerCase());
}

export function textOrNull(value: FormDataEntryValue | string | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

const PARK_ZONE = "Asia/Kuala_Lumpur";

export function parseParkDateTime(value: FormDataEntryValue | string | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return "invalid" as const;
  const date = new Date(`${text}:00+08:00`);
  if (Number.isNaN(date.getTime())) return "invalid" as const;
  return date.toISOString();
}

export function parkDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARK_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = pick("hour") === "24" ? "00" : pick("hour");
  return `${pick("year")}-${pick("month")}-${pick("day")}T${hour}:${pick("minute")}`;
}

export function parkStartParts(value: string, locale: "en" | "ms") {
  const date = new Date(value);
  const tag = locale === "ms" ? "ms-MY" : "en-MY";
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(tag, { timeZone: "Asia/Kuala_Lumpur", ...options }).format(date);
  return {
    month: format({ month: "short" }),
    day: format({ day: "numeric" }),
    weekday: format({ weekday: "long" }),
  };
}

export function formatParkWhen(startsAt: string, endsAt: string | null, locale: "en" | "ms") {
  const tag = locale === "ms" ? "ms-MY" : "en-MY";
  const start = new Date(startsAt);
  const date = new Intl.DateTimeFormat(tag, { timeZone: PARK_ZONE, dateStyle: "medium" });
  const time = new Intl.DateTimeFormat(tag, { timeZone: PARK_ZONE, timeStyle: "short" });
  const startLabel = `${date.format(start)}, ${time.format(start)}`;
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return startLabel;
  return date.format(start) === date.format(end)
    ? `${startLabel} – ${time.format(end)}`
    : `${startLabel} – ${date.format(end)}, ${time.format(end)}`;
}

