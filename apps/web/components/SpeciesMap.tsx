"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string | null;
  href?: string | null;
  /** Number of plants in this point. Above 1 it is drawn as an area, not an exact spot. */
  count?: number;
};

// Niah National Park, used when there are no points yet.
const PARK_CENTER: [number, number] = [3.8167, 113.7667];

export function SpeciesMap({
  points,
  approximate = false,
  linkLabel = "Open",
  height = 360,
}: {
  points: MapPoint[];
  /** true = public view: points are rounded areas, drawn as soft circles. */
  approximate?: boolean;
  linkLabel?: string;
  height?: number;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!box.current) return;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    import("leaflet").then((mod) => {
      // Leaflet is a CommonJS package; depending on the bundler it arrives as `default` or as the module itself.
      const L = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false }).setView(PARK_CENTER, 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const point of points) {
        const at: [number, number] = [point.latitude, point.longitude];
        bounds.push(at);
        const layer = approximate
          ? L.circle(at, { radius: 600, color: "#145c38", weight: 1, fillColor: "#145c38", fillOpacity: 0.25 })
          : L.circleMarker(at, { radius: 7, color: "#ffffff", weight: 2, fillColor: "#145c38", fillOpacity: 1 });
        layer.bindPopup(popupHtml(point, linkLabel));
        layer.addTo(map);
      }

      if (bounds.length === 1) map.setView(bounds[0], approximate ? 13 : 15);
      else if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, approximate, linkLabel]);

  return <div ref={box} style={{ height }} className="relative z-0 w-full overflow-hidden rounded-xl border" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function popupHtml(point: MapPoint, linkLabel: string) {
  const parts = [`<strong>${escapeHtml(point.title)}</strong>`];
  if (point.subtitle) parts.push(`<br>${escapeHtml(point.subtitle)}`);
  if (point.href) parts.push(`<br><a href="${escapeHtml(point.href)}">${escapeHtml(linkLabel)}</a>`);
  return parts.join("");
}
