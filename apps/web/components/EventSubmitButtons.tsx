"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

export function EventSubmitButtons({
  saveDraft,
  publish,
  saving,
}: {
  saveDraft: string;
  publish: string;
  saving: string;
}) {
  const { pending } = useFormStatus();
  const draftRef = useRef<HTMLButtonElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    const form = draftRef.current?.form;
    if (wasPending.current && !pending && form) {
      delete form.dataset.submitting;
      form.querySelectorAll("button[type=submit]").forEach((button) => {
        button.removeAttribute("aria-disabled");
        if (button instanceof HTMLButtonElement) button.style.pointerEvents = "";
      });
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        ref={draftRef}
        className="rounded border px-3 py-2 disabled:opacity-60"
        name="status"
        value="draft"
        type="submit"
        disabled={pending}
      >
        {pending ? saving : saveDraft}
      </button>
      <button className="btn" name="status" value="published" type="submit" disabled={pending}>
        {pending ? saving : publish}
      </button>
    </div>
  );
}
