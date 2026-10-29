"use client";

import { useEffect, useState } from "react";
import { cacheSpecies } from "@/lib/field-drafts";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function PrepareFieldCache({
  readyLabel,
  failedLabel,
  quiet = false,
}: {
  readyLabel: string;
  failedLabel: string;
  quiet?: boolean;
}) {
  const [state, setState] = useState<"working" | "ready" | "failed">("working");

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      }
      await fetch("/botanist", { credentials: "same-origin" });
      await fetch("/botanist/new", { credentials: "same-origin" });
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("species")
        .select("uuid, id, scientific_name, common_name")
        .is("hidden_at", null)
        .order("scientific_name");
      if (error) throw error;
      await cacheSpecies(data ?? []);
      if (!cancelled) setState("ready");
    }

    prepare().catch(() => {
      if (!cancelled) setState("failed");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (quiet || state === "working") return null;

  return (
    <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${state === "ready" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
      {state === "ready" ? readyLabel : failedLabel}
    </p>
  );
}
