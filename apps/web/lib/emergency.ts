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

export const emergencyColumns =
  "uuid, botanist_id, staff_id, botanist_name, latitude, longitude, status, created_at";

export function emergencyMissing(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "PGRST205" || error.code === "42P01" || /emergency_alerts|schema cache/i.test(message);
}

export function emergencyCoordinate(value: unknown, limit: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > limit) return null;
  return Math.round(n * 1e6) / 1e6;
}

export function emergencyPoint(latitude: unknown, longitude: unknown) {
  const lat = emergencyCoordinate(latitude, 90);
  const lng = emergencyCoordinate(longitude, 180);
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
