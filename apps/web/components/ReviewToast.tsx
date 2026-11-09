"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewToast({
  message,
  tone,
}: {
  message: string;
  tone: "approved" | "needs_revision" | "rejected";
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = window.setTimeout(() => setLeaving(true), 3200);
    const clear = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      params.delete("done");
      params.delete("plant");
      const query = params.toString();
      router.replace(query ? `${window.location.pathname}?${query}` : window.location.pathname, { scroll: false });
    }, 3700);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(clear);
    };
  }, [router]);

  const toneClass =
    tone === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "rejected"
        ? "border-red-200 bg-red-50 text-red-950"
        : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <p
      role="status"
      className={`fixed top-20 right-4 z-50 max-w-xs rounded-xl border px-4 py-3 text-sm font-medium shadow-sm transition-opacity duration-300 ${toneClass} ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      {message}
    </p>
  );
}
