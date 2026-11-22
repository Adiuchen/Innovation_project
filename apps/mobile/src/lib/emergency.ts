import type { Profile } from "@/types";
import { supabase } from "@/lib/supabase";

export type EmergencyAlert = {
  uuid: string;
  botanist_id: string;
  staff_id: string;
  botanist_name: string;
  latitude: number | null;
  longitude: number | null;
  status: "open" | "resolved";
  created_at: string;
};

const columns = "uuid, botanist_id, staff_id, botanist_name, latitude, longitude, status, created_at";

export function emergencyMissing(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "PGRST205" || error.code === "42P01" || /emergency_alerts|schema cache/i.test(message);
}

function coordinate(value: number | null, limit: number) {
  if (value == null || !Number.isFinite(value) || Math.abs(value) > limit) return null;
  return Math.round(value * 1e6) / 1e6;
}

function point(latitude: number | null, longitude: number | null) {
  const lat = coordinate(latitude, 90);
  const lng = coordinate(longitude, 180);
  if (lat == null || lng == null) return { latitude: null, longitude: null };
  return { latitude: lat, longitude: lng };
}

export function emergencyPlace(latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null) return null;
  const north = latitude >= 0 ? "N" : "S";
  const east = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(4)}° ${north}, ${Math.abs(longitude).toFixed(4)}° ${east}`;
}

export function emergencyMapUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export async function listOpenEmergencies() {
  const { data, error } = await supabase
    .from("emergency_alerts")
    .select(columns)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) {
    return { alerts: [] as EmergencyAlert[], missing: emergencyMissing(error), error: error.message };
  }
  return { alerts: (data ?? []) as EmergencyAlert[], missing: false, error: null as string | null };
}

export async function sendEmergency(profile: Profile, latitude: number | null, longitude: number | null) {
  const where = point(latitude, longitude);
  const payload = { ...where, created_at: new Date().toISOString() };
  const open = await supabase
    .from("emergency_alerts")
    .select("uuid")
    .eq("botanist_id", profile.uuid)
    .eq("status", "open")
    .maybeSingle();
  if (open.error) return { error: emergencyMissing(open.error) ? "setup" : open.error.message };
  if (open.data) {
    const updated = await supabase.from("emergency_alerts").update(payload).eq("uuid", open.data.uuid);
    return { error: updated.error ? updated.error.message : null };
  }
  const inserted = await supabase.from("emergency_alerts").insert({
    botanist_id: profile.uuid,
    staff_id: profile.id,
    botanist_name: profile.name.trim() || profile.id,
    status: "open",
    ...payload,
  });
  if (inserted.error?.code === "23505") {
    const again = await supabase
      .from("emergency_alerts")
      .select("uuid")
      .eq("botanist_id", profile.uuid)
      .eq("status", "open")
      .maybeSingle();
    if (!again.data) return { error: inserted.error.message };
    const updated = await supabase.from("emergency_alerts").update(payload).eq("uuid", again.data.uuid);
    return { error: updated.error ? updated.error.message : null };
  }
  if (inserted.error) return { error: emergencyMissing(inserted.error) ? "setup" : inserted.error.message };
  return { error: null as string | null };
}

export async function resolveEmergency(id: string) {
  const { error } = await supabase.from("emergency_alerts").update({ status: "resolved" }).eq("uuid", id).eq("status", "open");
  return { error: error ? error.message : null };
}

export function watchEmergencies(onChange: () => void) {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let stopped = false;

  async function listen() {
    const { data } = await supabase.auth.getSession();
    if (stopped) return;
    if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);
    if (stopped) return;
    channel = supabase
      .channel(`emergency-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts" }, () => onChange())
      .subscribe();
  }

  void listen();
  return () => {
    stopped = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
