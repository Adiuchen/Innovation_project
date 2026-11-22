"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resolveEmergency } from "@/app/emergency/actions";
import {
  emergencyMapUrl,
  emergencyPlace,
  type EmergencyAlert,
} from "@/lib/emergency";
import { formatParkTimeDate } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const columns = "uuid, botanist_id, staff_id, botanist_name, latitude, longitude, status, created_at";

export function EmergencyDesk({
  role,
  userId,
  initial,
  locale,
  t,
}: {
  role: "botanist" | "conservation_officer";
  userId: string;
  initial: EmergencyAlert[];
  locale: Locale;
  t: Copy;
}) {
  const [alerts, setAlerts] = useState(initial);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const known = useRef(new Set<string>());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAlerts(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let stopped = false;

    async function reload() {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .select(columns)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (stopped || error || !data) return;
      setAlerts(data as EmergencyAlert[]);
    }

    async function listen() {
      const { data } = await supabase.auth.getSession();
      if (stopped) return;
      if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);
      if (stopped) return;
      channel = supabase
        .channel("emergency-alerts")
        .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts" }, () => {
          void reload();
        })
        .subscribe();
    }

    void listen();
    const timer = window.setInterval(() => void reload(), 15000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const incoming = alerts.filter((alert) => alert.botanist_id !== userId);
  const incomingKey = incoming.map((alert) => alert.uuid).join("|");

  useEffect(() => {
    const ids = incomingKey ? incomingKey.split("|") : [];
    const fresh = ids.some((id) => !known.current.has(id));
    for (const id of ids) known.current.add(id);
    if (ids.length === 0) setOpen(false);
    else if (fresh) setOpen(true);
  }, [incomingKey]);

  if (!mounted || incoming.length === 0) return null;

  async function clear(id: string) {
    setSending(true);
    setNote(null);
    const result = await resolveEmergency(id);
    setSending(false);
    if (result.error === "setup") setNote(t.emergencySetup);
    else if (result.error) setNote(t.emergencyFailed);
    else setAlerts((current) => current.filter((alert) => alert.uuid !== id));
  }

  const label = incoming.length > 1 ? `${incoming.length} ${t.emergency}` : t.emergency;

  return createPortal(
    <>
      {!open && (
        <button
          type="button"
          className="fixed top-20 right-4 z-50 rounded-full bg-[#8f2d2d] px-3 py-2 text-sm font-semibold text-white shadow-md"
          onClick={() => setOpen(true)}
        >
          {label}
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <button type="button" className="absolute inset-0" aria-label={t.emergencyClose} onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#8f2d2d]">{t.emergency}</h2>
              <button type="button" className="text-sm font-semibold" onClick={() => setOpen(false)}>
                {t.emergencyClose}
              </button>
            </div>
            <ul className="mt-4 grid gap-4">
              {incoming.map((alert) => {
                const place = emergencyPlace(alert.latitude, alert.longitude);
                return (
                  <li key={alert.uuid}>
                    <p className="font-semibold">
                      {t.emergencyIncoming.replace("{name}", alert.botanist_name).replace("{id}", alert.staff_id)}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatParkTimeDate(alert.created_at, locale)}
                      {" · "}
                      {place ?? t.emergencyNoLocation}
                    </p>
                    <div className="mt-2 flex gap-4 text-sm font-semibold">
                      {place && alert.latitude != null && alert.longitude != null && (
                        <a className="underline" href={emergencyMapUrl(alert.latitude, alert.longitude)} target="_blank" rel="noreferrer">
                          {t.emergencyMap}
                        </a>
                      )}
                      {role === "conservation_officer" && (
                        <button type="button" disabled={sending} onClick={() => void clear(alert.uuid)}>
                          {t.emergencyResolve}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {note && <p className="mt-3 text-sm text-red-800">{note}</p>}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
