"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Decision = "approved" | "needs_revision" | "rejected";

export function ReviewDecisionForm({
  action,
  recordId,
  next,
  plantLabel,
  earlierNote,
  defaultNote,
  reviewHref,
  showNote = true,
  className,
  labels,
}: {
  action: (formData: FormData) => void | Promise<void>;
  recordId: string;
  next: string;
  plantLabel: string;
  earlierNote: string | null;
  defaultNote: string;
  reviewHref?: string;
  showNote?: boolean;
  className: string;
  labels: {
    earlierNote: string;
    earlierNoteHint: string;
    noteToBotanist: string;
    reviewFull: string;
    approve: string;
    requestChanges: string;
    reject: string;
    confirm: string;
    cancel: string;
    confirmApproveTitle: string;
    confirmApproveBody: string;
    feedbackRequiredTitle: string;
    feedbackRequiredChanges: string;
    feedbackRequiredReject: string;
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const noteRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const statusRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState<Decision | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onToggle = () => {
      if (!el.matches(":popover-open")) setPending(null);
    };
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (pending) {
      if (!el.matches(":popover-open")) el.showPopover();
      if (pending !== "approved") draftRef.current?.focus();
    } else if (el.matches(":popover-open")) {
      el.hidePopover();
    }
  }, [pending]);

  function submit(status: Decision, note?: string) {
    if (statusRef.current) statusRef.current.value = status;
    if (note != null && noteRef.current) noteRef.current.value = note;
    setPending(null);
    formRef.current?.requestSubmit();
  }

  function ask(status: Decision) {
    if (status !== "approved" && showNote) {
      const current = noteRef.current?.value.trim() ?? "";
      if (current) {
        submit(status);
        return;
      }
    }
    if (status !== "approved") setDraft("");
    setPending(status);
  }

  function confirmPending() {
    if (pending === "approved") {
      submit("approved");
      return;
    }
    const text = draft.trim();
    if (!text || !pending) return;
    submit(pending, text);
  }

  const needsNote = pending === "needs_revision" || pending === "rejected";
  const noteReady = draft.trim().length > 0;

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className={className}
        onSubmit={(event) => {
          if (!statusRef.current?.value) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={recordId} />
        <input type="hidden" name="next" value={next} />
        <input ref={statusRef} type="hidden" name="status" defaultValue="" />
        {earlierNote ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <span className="font-medium">{labels.earlierNote}</span>
            <span className="mt-1 block whitespace-pre-wrap">{earlierNote}</span>
            <span className="mt-1 block text-xs text-amber-800">{labels.earlierNoteHint}</span>
          </p>
        ) : null}
        {showNote ? (
          <textarea
            ref={noteRef}
            className="w-full rounded border px-2 py-1"
            name="review_note"
            rows={3}
            placeholder={labels.noteToBotanist}
            defaultValue={defaultNote}
          />
        ) : (
          <input ref={noteRef} type="hidden" name="review_note" defaultValue="" />
        )}
        <div className={reviewHref ? "flex flex-wrap items-center justify-between gap-3 border-t border-emerald-950/10 pt-3" : "flex flex-wrap gap-2"}>
          <div className="flex flex-wrap gap-2">
            <button className="btn h-9 rounded-lg px-3 py-0" type="button" onClick={() => ask("approved")}>
              {labels.approve}
            </button>
            <button className="inline-flex h-9 items-center rounded-lg border border-emerald-950/15 bg-white px-3 text-sm font-semibold text-emerald-950" type="button" onClick={() => ask("needs_revision")}>
              {labels.requestChanges}
            </button>
            <button className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-800" type="button" onClick={() => ask("rejected")}>
              {labels.reject}
            </button>
          </div>
          {reviewHref ? (
            <Link className="inline-flex h-9 items-center rounded-lg border border-forest bg-white px-3 text-sm font-semibold text-forest" href={reviewHref}>
              {labels.reviewFull}
            </Link>
          ) : null}
        </div>
      </form>
      <div
        ref={dialogRef}
        popover="manual"
        role="dialog"
        aria-modal="true"
        className="m-auto h-fit w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-black/10 bg-white p-5 shadow-2xl backdrop:bg-emerald-950/30"
      >
        {pending === "approved" ? (
          <>
            <h2 className="text-lg font-semibold">{labels.confirmApproveTitle}</h2>
            <p className="mt-2 text-sm text-neutral-700">{labels.confirmApproveBody.replace("{name}", plantLabel)}</p>
          </>
        ) : null}
        {needsNote ? (
          <>
            <h2 className="text-lg font-semibold">{labels.feedbackRequiredTitle}</h2>
            <p className="mt-2 text-sm text-neutral-700">
              {pending === "rejected" ? labels.feedbackRequiredReject : labels.feedbackRequiredChanges}
            </p>
            <label className="mt-3 block text-sm font-medium">
              {labels.noteToBotanist}
              <textarea
                ref={draftRef}
                className="mt-1 w-full rounded border px-2 py-1 font-normal"
                rows={4}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
          </>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setPending(null)}>
            {labels.cancel}
          </button>
          <button
            className={pending === "rejected" ? "rounded bg-red-700 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50" : "btn disabled:opacity-50"}
            type="button"
            disabled={needsNote && !noteReady}
            onClick={confirmPending}
          >
            {pending === "needs_revision" ? labels.requestChanges : pending === "rejected" ? labels.reject : labels.confirm}
          </button>
        </div>
      </div>
    </>
  );
}
