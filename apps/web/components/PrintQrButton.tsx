"use client";

import { useState } from "react";

export function PrintQrButton({
  qrCode,
  label,
  printingLabel,
  successLabel,
  failedLabel,
}: {
  qrCode: string;
  label: string;
  printingLabel: string;
  successLabel: string;
  failedLabel: string;
}) {
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function printQr() {
    setPrinting(true);
    setFailed(false);
    setMessage("");
    try {
      const response = await fetch("/api/print/plant-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setFailed(true);
        setMessage(body?.error || failedLabel);
        return;
      }
      setMessage(successLabel);
    } catch {
      setFailed(true);
      setMessage(failedLabel);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="mt-3">
      <button className="btn" type="button" onClick={printQr} disabled={printing}>
        {printing ? printingLabel : label}
      </button>
      {message && <p className={`mt-2 text-sm ${failed ? "text-red-700" : "text-neutral-600"}`}>{message}</p>}
    </div>
  );
}
