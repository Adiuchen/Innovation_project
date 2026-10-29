"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type EventSlide = {
  id: string;
  title: string;
  when: string;
  location: string | null;
  description: string | null;
  image: string | null;
};

export function EventCarousel({
  slides,
  label,
  viewLabel,
}: {
  slides: EventSlide[];
  label: string;
  viewLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[index] ?? slides[0];

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [index, paused, slides.length]);

  if (!slide) return null;

  const photo = Boolean(slide.image);

  return (
    <section
      className={`relative mt-8 overflow-hidden ${photo ? "min-h-56 rounded-3xl text-white" : "surface px-5 py-4 sm:px-6"}`}
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div key={slide.id} className="event-banner-in">
        {photo && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image ?? ""} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-emerald-950/60 to-emerald-950/25" />
          </>
        )}
        <div className={photo ? "relative px-5 py-6 sm:px-6" : undefined}>
          <Link href={`/e/${slide.id}`} className="flex items-center justify-between gap-4" data-slide={slide.id}>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${photo ? "text-emerald-100" : "text-forest"}`}>{label}</p>
              <h2 className="mt-1 truncate text-2xl font-semibold">{slide.title}</h2>
              <p className={`mt-1 truncate text-sm ${photo ? "text-white/85" : "text-neutral-600"}`}>
                {slide.when}
                {slide.location ? ` · ${slide.location}` : ""}
              </p>
              {slide.description && (
                <p className={`mt-1 line-clamp-1 text-sm ${photo ? "text-white/75" : "text-neutral-700"}`}>{slide.description}</p>
              )}
            </div>
            <span className={photo ? "inline-flex shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-forest" : "btn shrink-0"}>
              {viewLabel}
            </span>
          </Link>
          {slides.length > 1 && (
            <div className="mt-3 flex gap-2">
              {slides.map((item, dot) => (
                <button
                  key={item.id}
                  type="button"
                  className={`h-2 w-2 rounded-full ${dot === index ? (photo ? "bg-white" : "bg-forest") : photo ? "bg-white/45" : "bg-neutral-300"}`}
                  aria-label={item.title}
                  aria-current={dot === index ? "true" : undefined}
                  onClick={() => setIndex(dot)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
