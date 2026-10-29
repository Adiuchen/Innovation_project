"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function StickyBar({ children, className }: { children: ReactNode; className?: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = document.querySelector("header");
    const node = bar.current;
    if (!header || !node) return;

    const place = () => {
      node.style.top = `${header.getBoundingClientRect().height}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={bar}
      className={
        className ??
        "sticky top-14 z-30 -mx-4 mb-4 border-b border-emerald-950/10 bg-paper/95 px-4 py-3 backdrop-blur"
      }
    >
      {children}
    </div>
  );
}
