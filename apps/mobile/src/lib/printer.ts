import TcpSocket from "react-native-tcp-socket";
import { plantQrValue } from "@/lib/plant";
import { siteUrl } from "@/lib/supabase";

const DEFAULT_PORT = 9100;
const PRINT_TIMEOUT_MS = 8000;

export type PrinterTarget = {
  host: string;
  port: number;
};

export function parsePrinterHost(raw: string | null | undefined): string | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(text)) return null;
  const parts = text.split(".").map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return text;
}

export function printerPort(raw: string | number | null | undefined) {
  const value = typeof raw === "number" ? raw : Number(String(raw ?? "").trim() || DEFAULT_PORT);
  if (!Number.isFinite(value) || value < 1 || value > 65535) return DEFAULT_PORT;
  return Math.floor(value);
}

function encodeAscii(text: string) {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index) & 0x7f;
  }
  return bytes;
}

function concatBytes(...parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** ESC/POS native QR (model 2) plus centered label text. */
export function buildPlantQrTicket(input: { url: string; label: string }) {
  const label = input.label.replace(/[^\x20-\x7E]/g, "?").slice(0, 32);
  const data = encodeAscii(input.url);
  const storeLen = data.length + 3;
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;

  return concatBytes(
    Uint8Array.from([0x1b, 0x40]),
    Uint8Array.from([0x1b, 0x61, 0x01]),
    Uint8Array.from([0x1d, 0x21, 0x11]),
    encodeAscii(`${label}\n\n`),
    Uint8Array.from([0x1d, 0x21, 0x00]),
    // Select model 2
    Uint8Array.from([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
    // Module size 8
    Uint8Array.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x08]),
    // Error correction M
    Uint8Array.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]),
    // Store data
    Uint8Array.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]),
    data,
    // Print
    Uint8Array.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
    encodeAscii("\n\n\n"),
    // Partial cut
    Uint8Array.from([0x1d, 0x56, 0x01]),
  );
}

function sendBytes(target: PrinterTarget, payload: Uint8Array) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        client.destroy();
      } catch {
        // Socket may already be closed.
      }
      if (error) {
        reject(error instanceof Error ? error : new Error("Could not reach the printer."));
        return;
      }
      resolve();
    };

    const timer = setTimeout(() => {
      finish(new Error(`Printer at ${target.host}:${target.port} did not respond.`));
    }, PRINT_TIMEOUT_MS);

    const client = TcpSocket.createConnection(
      { host: target.host, port: target.port, reuseAddress: true },
      () => {
        client.write(payload, undefined, (error) => {
          if (error) {
            finish(error);
            return;
          }
          // Give the printer a moment to accept the job before closing.
          setTimeout(() => finish(), 250);
        });
      },
    );

    client.on("error", (error) => finish(error));
  });
}

export async function printPlantQrLocal(
  qrCode: string,
  target: PrinterTarget,
  label?: string | null,
) {
  const host = parsePrinterHost(target.host);
  if (!host) return "Set the printer IP in Settings before printing.";
  const url = plantQrValue(qrCode, siteUrl);
  const ticket = buildPlantQrTicket({
    url,
    label: (label || qrCode).slice(0, 32),
  });
  try {
    await sendBytes({ host, port: printerPort(target.port) }, ticket);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "printer";
  }
}
