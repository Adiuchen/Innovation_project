import type { SupabaseClient } from "@supabase/supabase-js";

export type Esp32EventName =
  | "boot"
  | "armed"
  | "rain_started"
  | "rain_stopped"
  | "plant_disturbed"
  | "plant_stolen"
  | "heartbeat";

export type PlantStatus = "arming" | "ok" | "disturbed" | "stolen" | "unarmed";

export type Esp32Event = {
  id: number;
  created_at: string;
  event_at: string | null;
  device_id: string;
  event: Esp32EventName;
  is_raining: boolean;
  plant_status: PlantStatus;
  temperature_c: number | null;
  humidity: number | null;
  distance_cm: number | null;
};

const ALERT_EVENTS: Esp32EventName[] = ["plant_stolen", "plant_disturbed", "rain_started", "rain_stopped"];
const OFFLINE_AFTER_MS = 15 * 60 * 1000;
const PARK_ZONE = "Asia/Kuala_Lumpur";
const DAY_MS = 24 * 60 * 60 * 1000;

export function eventTime(row: Pick<Esp32Event, "event_at" | "created_at">) {
  return row.event_at ?? row.created_at;
}

export function isDeviceOffline(latest: Esp32Event, now = Date.now()) {
  const received = new Date(latest.created_at).getTime();
  return Number.isNaN(received) || now - received > OFFLINE_AFTER_MS;
}

export function formatTemperature(value: number | null) {
  return value == null ? null : `${value.toFixed(1)}°C`;
}

export function formatHumidity(value: number | null) {
  return value == null ? null : `${Math.round(value)}%`;
}

function parkDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARK_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function daysSinceRain(lastRainAt: string | null, rainingNow: boolean, now = new Date()) {
  if (rainingNow) return 0;
  if (!lastRainAt) return null;
  const then = new Date(lastRainAt);
  if (Number.isNaN(then.getTime())) return null;
  const start = Date.parse(`${parkDateKey(then)}T00:00:00Z`);
  const end = Date.parse(`${parkDateKey(now)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

export type Esp32Snapshot = {
  latest: Esp32Event | null;
  alerts: Esp32Event[];
  lastRainAt: string | null;
  daysSinceRain: number | null;
};

function numberOrNull(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isAtLeast(value: string, other: string) {
  return new Date(value).getTime() >= new Date(other).getTime();
}

export function parseEsp32Event(value: unknown): Esp32Event | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.created_at !== "string" || typeof row.device_id !== "string" || typeof row.event !== "string") return null;
  if (typeof row.plant_status !== "string") return null;
  return {
    id: Number(row.id),
    created_at: row.created_at,
    event_at: typeof row.event_at === "string" ? row.event_at : null,
    device_id: row.device_id,
    event: row.event as Esp32EventName,
    is_raining: row.is_raining === true || row.is_raining === "true",
    plant_status: row.plant_status as PlantStatus,
    temperature_c: numberOrNull(row.temperature_c),
    humidity: numberOrNull(row.humidity),
    distance_cm: numberOrNull(row.distance_cm),
  };
}

export function applyEsp32Event(snapshot: Esp32Snapshot, row: Esp32Event, now = new Date()): Esp32Snapshot {
  const latest = !snapshot.latest || isAtLeast(row.created_at, snapshot.latest.created_at) ? row : snapshot.latest;
  const alerts = ALERT_EVENTS.includes(row.event)
    ? [row, ...snapshot.alerts.filter((alert) => alert.id !== row.id)].slice(0, 20)
    : snapshot.alerts;
  const rainAt = row.is_raining || row.event === "rain_stopped" ? eventTime(row) : null;
  const lastRainAt = rainAt && (!snapshot.lastRainAt || isAtLeast(rainAt, snapshot.lastRainAt)) ? rainAt : snapshot.lastRainAt;
  return {
    latest,
    alerts,
    lastRainAt,
    daysSinceRain: daysSinceRain(lastRainAt, Boolean(latest?.is_raining), now),
  };
}

const columns = "id, created_at, event_at, device_id, event, is_raining, plant_status, temperature_c, humidity, distance_cm";

export async function loadEsp32Snapshot(supabase: SupabaseClient) {
  const [latestResult, alertResult, rainResult] = await Promise.all([
    supabase.from("esp32_events").select(columns).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from("esp32_events")
      .select(columns)
      .in("event", ALERT_EVENTS)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("esp32_events")
      .select(columns)
      .or("is_raining.eq.true,event.eq.rain_stopped")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const latest = (latestResult.data ?? null) as Esp32Event | null;
  const lastRain = (rainResult.data ?? null) as Esp32Event | null;
  const lastRainAt = lastRain ? eventTime(lastRain) : null;

  return {
    latest,
    alerts: (alertResult.data ?? []) as Esp32Event[],
    lastRainAt,
    daysSinceRain: daysSinceRain(lastRainAt, Boolean(latest?.is_raining)),
    error: latestResult.error ?? alertResult.error ?? rainResult.error,
  };
}
