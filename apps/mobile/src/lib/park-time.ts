import type { Locale } from "@/lib/copy";

const PARK_ZONE = "Asia/Kuala_Lumpur";

function localeTag(locale: Locale) {
  if (locale === "zh") return "zh-CN";
  if (locale === "ms") return "ms-MY";
  return "en-MY";
}

export function combineParkDateTime(date: string, time: string) {
  const day = date.trim();
  const clock = time.trim();
  if (!day && !clock) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) return "invalid" as const;
  const parsed = new Date(`${day}T${clock}:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return "invalid" as const;
  return parsed.toISOString();
}

export function splitParkDateTime(value: string | null | undefined) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
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
  return { date: `${pick("year")}-${pick("month")}-${pick("day")}`, time: `${hour}:${pick("minute")}` };
}

export function parkStartParts(value: string, locale: Locale) {
  const date = new Date(value);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(localeTag(locale), { timeZone: PARK_ZONE, ...options }).format(date);
  return {
    month: format({ month: "short" }),
    day: format({ day: "numeric" }),
    weekday: format({ weekday: "long" }),
  };
}

export function formatParkWhen(startsAt: string, endsAt: string | null, locale: Locale) {
  const start = new Date(startsAt);
  const date = new Intl.DateTimeFormat(localeTag(locale), { timeZone: PARK_ZONE, dateStyle: "medium" });
  const time = new Intl.DateTimeFormat(localeTag(locale), { timeZone: PARK_ZONE, timeStyle: "short" });
  const startLabel = `${date.format(start)}, ${time.format(start)}`;
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return startLabel;
  return date.format(start) === date.format(end)
    ? `${startLabel} – ${time.format(end)}`
    : `${startLabel} – ${date.format(end)}, ${time.format(end)}`;
}
