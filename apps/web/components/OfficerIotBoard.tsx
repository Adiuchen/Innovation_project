"use client";

import { useEffect, useState } from "react";
import {
  applyEsp32Event,
  eventTime,
  formatHumidity,
  formatTemperature,
  isDeviceOffline,
  parseEsp32Event,
  type Esp32Snapshot,
} from "@/lib/esp32";
import { formatParkTimeDate } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n";
import { statusTone } from "@/lib/status-tone";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const statusLabels: Record<string, keyof Copy> = {
  ok: "plantOk",
  disturbed: "plantDisturbed",
  stolen: "plantStolen",
  arming: "plantArming",
  unarmed: "plantUnarmed",
  rain_started: "rainStarted",
  plant_disturbed: "plantDisturbed",
  plant_stolen: "plantStolen",
};

function statusLabel(status: string, t: Copy) {
  const key = statusLabels[status];
  return key ? t[key] : status;
}

function rainAgoLabel(days: number | null, t: Copy) {
  if (days == null) return t.noRainRecorded;
  if (days === 0) return t.rainedToday;
  if (days === 1) return t.rainedOneDay;
  return t.rainedDays.replace("{count}", String(days));
}

export function OfficerIotBoard({
  initial,
  locale,
  t,
}: {
  initial: Esp32Snapshot;
  locale: Locale;
  t: Copy;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const { latest, alerts, daysSinceRain: daysAgo } = snapshot;
  const offline = latest ? isDeviceOffline(latest, now) : false;

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let stopped = false;

    async function listen() {
      const { data } = await supabase.auth.getSession();
      if (stopped) return;
      if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);
      if (stopped) return;
      channel = supabase
        .channel("esp32-events")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "esp32_events" }, (payload) => {
          const row = parseEsp32Event(payload.new);
          if (!row) return;
          setSnapshot((current) => applyEsp32Event(current, row));
          setNow(Date.now());
        })
        .subscribe();
    }

    void listen();
    return () => {
      stopped = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!latest) return;
    const remaining = new Date(latest.created_at).getTime() + 15 * 60 * 1000 - Date.now();
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), remaining + 250);
    return () => window.clearTimeout(timer);
  }, [latest]);

  return (
    <>
      {!latest && <p className="mt-4 text-sm text-neutral-500">{t.noEsp32Events}</p>}

      {latest && (
        <>
          {offline && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{t.deviceOffline}</p>
          )}
          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="surface p-4">
              <h2 className="text-sm text-neutral-600">{t.rainingNow}</h2>
              <p className="mt-1 text-lg font-medium">{latest.is_raining ? t.raining : t.notRaining}</p>
              <p className="mt-1 text-sm text-neutral-500">{rainAgoLabel(daysAgo, t)}</p>
            </article>
            <article className="surface p-4">
              <h2 className="text-sm text-neutral-600">{t.plantStatus}</h2>
              <p className="mt-3">
                <span
                  className={`inline-flex min-h-10 min-w-28 items-center justify-center rounded-full px-6 text-m font-semibold ${statusTone(latest.plant_status)}`}
                >
                  {statusLabel(latest.plant_status, t)}
                </span>
              </p>
            </article>
            <article className="surface p-4 sm:col-span-2">
              <h2 className="text-sm text-neutral-600">{t.latestClimate}</h2>
              <p className="mt-1 text-lg font-medium">
                {formatTemperature(latest.temperature_c) ?? t.noReading}
                {" · "}
                {formatHumidity(latest.humidity) ?? t.noReading}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {formatParkTimeDate(eventTime(latest), locale)} · {t.device} {latest.device_id}
              </p>
            </article>
          </section>
        </>
      )}

      <h2 className="mt-8 text-xl font-semibold">{t.alerts}</h2>
      {alerts.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">{t.noAlerts}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id} className="surface p-3 text-sm">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(alert.event)}`}>
                {statusLabel(alert.event, t)}
              </span>
              <p className="mt-2">
                {alert.is_raining ? t.raining : t.notRaining}
                {" · "}
                {formatTemperature(alert.temperature_c) ?? t.noReading}
                {" · "}
                {formatHumidity(alert.humidity) ?? t.noReading}
              </p>
              <p className="text-neutral-500">
                {formatParkTimeDate(eventTime(alert), locale)} · {t.device} {alert.device_id}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
