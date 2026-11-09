import Constants from "expo-constants";
import { NativeModules } from "react-native";
import { plantQrValue } from "@/lib/plant";
import { siteUrl, supabase } from "@/lib/supabase";

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

type TcpConnection = {
  write: (data: Uint8Array, encoding: undefined, callback?: (error?: Error) => void) => void;
  destroy: () => void;
  on: (event: "error", listener: (error: Error) => void) => void;
};

type TcpSocketModule = {
  createConnection: (
    options: { host: string; port: number; reuseAddress?: boolean },
    callback?: () => void,
  ) => TcpConnection;
};

/** Expo Go has no TcpSockets native module. Importing the package builds a NativeEventEmitter and crashes. */
function loadTcpSocket(): TcpSocketModule | null {
  if (NativeModules.TcpSockets == null) return null;
  const loaded = require("react-native-tcp-socket") as TcpSocketModule & { default?: TcpSocketModule };
  return typeof loaded.createConnection === "function" ? loaded : loaded.default ?? null;
}

function sendBytes(target: PrinterTarget, payload: Uint8Array, tcp: TcpSocketModule) {
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

    const client = tcp.createConnection(
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
  const destination = { host, port: printerPort(target.port) };
  const tcp = loadTcpSocket();
  if (!tcp) return printViaWebsite(qrCode, destination);
  const url = plantQrValue(qrCode, siteUrl);
  const ticket = buildPlantQrTicket({
    url,
    label: (label || qrCode).slice(0, 32),
  });
  try {
    await sendBytes(destination, ticket, tcp);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "printer";
  }
}

function reachableDevSite() {
  const scriptURL = String(NativeModules.SourceCode?.scriptURL ?? "");
  const fromBundle = scriptURL.match(/^[a-z]+:\/\/([^:/]+)/i)?.[1] ?? "";
  const hostname = parsePrinterHost(Constants.expoConfig?.hostUri?.split(":")[0] ?? "") ?? parsePrinterHost(fromBundle) ?? "";
  if (!hostname) return null;
  let port = "3000";
  try {
    port = new URL(siteUrl).port || "3000";
  } catch {
    port = "3000";
  }
  const fallback = `http://${hostname}:${port}`;
  return fallback === siteUrl ? null : fallback;
}

async function postPrint(url: string, token: string, qrCode: string, target: PrinterTarget) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${url}/api/print/plant-qr?t=${Date.now()}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
      body: JSON.stringify({ qrCode, host: target.host, port: target.port, pageUrl: url, nonce: Date.now() }),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as { ok?: boolean; bytes?: number; error?: string } | null;
    const printed = body?.ok === true && typeof body.bytes === "number" && body.bytes > 200;
    return { thrown: false, status: response.status, error: printed ? null : body?.error || "printer", bytes: body?.bytes ?? 0 };
  } catch (error) {
    return { thrown: true, status: 0, error: error instanceof Error ? error.message : String(error), bytes: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function printViaWebsite(qrCode: string, target: PrinterTarget) {
  if (!siteUrl) return "dev-build";
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return "Sign in again before printing.";

  const fallback = reachableDevSite();
  const firstTarget = fallback ?? siteUrl;
  const first = await postPrint(firstTarget, token, qrCode, target);
  if (!first.thrown) {
    if (first.status < 200 || first.status >= 300) return first.error || "printer";
    return null;
  }

  const second = fallback ? await postPrint(siteUrl, token, qrCode, target) : null;
  if (second && !second.thrown) {
    if (second.status < 200 || second.status >= 300) return second.error || "printer";
    return null;
  }

  return "website";
}
