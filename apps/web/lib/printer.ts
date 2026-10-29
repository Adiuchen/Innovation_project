import { createRequire } from "node:module";
import type net from "node:net";

const require = createRequire(import.meta.url);

type EscposPrinter = {
  font: (name: string) => EscposPrinter;
  align: (value: "ct" | "lt") => EscposPrinter;
  style: (value: string) => EscposPrinter;
  size: (width: number, height: number) => EscposPrinter;
  text: (value: string) => EscposPrinter;
  qrcode: (code: string, version: number, level: string, size: number) => EscposPrinter;
  newLine: () => EscposPrinter;
  cut: () => EscposPrinter;
  close: (callback?: (error?: unknown) => void) => void;
};

type EscposDevice = {
  open: (callback: (error?: unknown) => void) => void;
  device: net.Socket;
};

const PRINTER_TIMEOUT_MS = 8000;

export async function printPlantQr(input: { url: string; label: string }) {
  const ip = process.env.PRINTER_IP || "192.168.0.138";
  const portNumber = Number(process.env.PRINTER_PORT || "9100");
  const port = Number.isFinite(portNumber) ? portNumber : 9100;
  const EscposPrinter = require("escpos/printer") as new (device: EscposDevice) => EscposPrinter;
  const EscposNetwork = require("escpos-network") as new (address: string, port: number) => EscposDevice;
  const device = new EscposNetwork(ip, port);
  const printer = new EscposPrinter(device);
  device.device.setTimeout(PRINTER_TIMEOUT_MS);

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        const message = error instanceof Error ? error.message : "Could not connect to the printer.";
        reject(new Error(message));
        return;
      }
      resolve();
    };
    const timer = setTimeout(() => {
      device.device.destroy();
      finish(new Error(`Printer at ${ip}:${port} did not respond.`));
    }, PRINTER_TIMEOUT_MS);

    device.open((error) => {
      if (settled) return;
      if (error) {
        finish(error instanceof Error ? error : new Error("Could not connect to the printer."));
        return;
      }
      try {
        printer.font("A").align("ct").style("normal").size(1, 1);
        printer.text(input.label);
        printer.qrcode(input.url, qrVersion(input.url), "M", 8);
        printer.newLine().cut().close((closeError) => {
          finish(closeError ?? undefined);
        });
      } catch (err) {
        device.device.destroy();
        finish(err);
      }
    });
  });
}

function qrVersion(text: string) {
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= 50) return 4;
  if (bytes <= 70) return 5;
  if (bytes <= 100) return 6;
  if (bytes <= 140) return 8;
  return 10;
}
