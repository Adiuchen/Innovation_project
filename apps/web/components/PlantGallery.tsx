"use client";

import { useState } from "react";

export function PlantGallery({
  photos,
  emptyLabel,
  qrSrc,
  qrAlt,
}: {
  photos: { id: string; src: string; caption: string | null }[];
  emptyLabel: string;
  qrSrc?: string | null;
  qrAlt?: string;
}) {
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  return (
    <div className="flex min-h-80 min-w-0 flex-1 flex-col gap-3">
      <div className="relative aspect-[4/3] min-h-80 flex-1 overflow-hidden rounded-[1.75rem] bg-[#1c3a28] shadow-[0_18px_40px_rgb(20_48_32/0.12)] md:aspect-auto">
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.caption ?? ""} className="absolute inset-0 h-full w-full object-cover" />
            {photos.length > 1 && (
              <p className="absolute top-4 left-4 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
                {active + 1} / {photos.length}
              </p>
            )}
            {current.caption && (
              <p className="absolute bottom-4 left-4 max-w-[58%] truncate rounded-full bg-black/50 px-3 py-1 text-xs text-white">{current.caption}</p>
            )}
          </>
        ) : (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/80">{emptyLabel}</p>
        )}
        {qrSrc && (
          <div className="absolute right-4 bottom-4 rounded-2xl bg-white p-1.5 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt={qrAlt ?? ""} className="h-24 w-24" />
          </div>
        )}
      </div>
      {photos.length > 1 && (
        <ul className="flex min-w-0 gap-2 overflow-x-auto">
          {photos.map((photo, index) => {
            const selected = index === active;
            return (
              <li key={photo.id} className="shrink-0">
                <button
                  type="button"
                  aria-label={photo.caption || `${index + 1}`}
                  aria-pressed={selected}
                  onClick={() => setActive(index)}
                  className={`block h-12 w-12 overflow-hidden rounded-lg ${selected ? "ring-2 ring-forest" : "opacity-80 ring-1 ring-black/10"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.src} alt="" className="h-full w-full object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
