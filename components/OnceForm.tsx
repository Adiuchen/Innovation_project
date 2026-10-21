"use client";

import type { ReactNode } from "react";

export function OnceForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        const form = event.currentTarget;
        if (form.dataset.submitting === "true") {
          event.preventDefault();
          return;
        }
        form.dataset.submitting = "true";
        form.querySelectorAll("button[type=submit]").forEach((button) => {
          button.setAttribute("aria-disabled", "true");
          if (button instanceof HTMLButtonElement) button.style.pointerEvents = "none";
        });
      }}
    >
      {children}
    </form>
  );
}
