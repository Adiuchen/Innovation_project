"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listDrafts, syncDrafts, type FieldDraft } from "@/lib/field-drafts";
import type { Copy } from "@/lib/i18n";

export function PendingDrafts({ t }: { t: Copy }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<FieldDraft[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listDrafts().then(async (waiting) => {
      setDrafts(waiting);
      if (waiting.length === 0 || !navigator.onLine) return;
      const result = await syncDrafts();
      setDrafts(await listDrafts());
      if (result.error) setMessage(result.error);
      else if (result.uploaded > 0) {
        setMessage(`${t.uploadedCount}: ${result.uploaded}`);
        router.refresh();
      }
    });
  }, [router, t.uploadedCount]);

  if (drafts.length === 0 && !message) return null;

  return (
    <section className="surface mt-4 shrink-0 p-4 text-sm">
      <h2 className="font-medium">
        {t.pendingUploads} ({drafts.length})
      </h2>
      {message && <p className="mt-2 text-neutral-700">{message}</p>}
      <ul className="mt-2 space-y-1">
        {drafts.map((draft) => (
          <li key={draft.localId}>
            {draft.speciesLabel || t.unidentified}
            {draft.locationName ? ` · ${draft.locationName}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
