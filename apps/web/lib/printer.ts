import { createRequire } from "node:module";
import type net from "node:net";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode") as {
  create: (text: string, options: { errorCorrectionLevel: "M" }) => {
    modules: { size: number; get: (row: number, col: number) => number };
  };
};

type EscposPrinter = {
  hardware: (hw: string) => EscposPrinter;
  font: (name: string) => EscposPrinter;
  align: (value: "ct" | "lt") => EscposPrinter;
  style: (value: string) => EscposPrinter;
  size: (width: number, height: number) => EscposPrinter;
  text: (value: string) => EscposPrinter;
  print: (value: Buffer) => EscposPrinter;
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
        printer.hardware("init").font("A").align("ct").style("normal");
        printer.size(2, 2).text(input.label);
        printer.newLine().newLine();
        printer.print(qrImage(input.url));
        printer.newLine().newLine().newLine();
        printer.cut().close((closeError) => {
          finish(closeError ?? undefined);
        });
      } catch (err) {
        device.device.destroy();
        finish(err);
      }
    });
  });
}

function qrImage(text: string) {
  const symbol = QRCode.create(text, { errorCorrectionLevel: "M" });
  const count = symbol.modules.size;
  const quiet = 2;
  let scale = 9;
  while ((count + quiet * 2) * scale > 384 && scale > 3) scale -= 1;
  const dots = (count + quiet * 2) * scale;
  const bands = Math.ceil(dots / 24);
  const parts = [Buffer.from([0x1b, 0x33, 24])];

  for (let band = 0; band < bands; band += 1) {
    const slice = Buffer.alloc(dots * 3);
    for (let x = 0; x < dots; x += 1) {
      for (let bit = 0; bit < 24; bit += 1) {
        const y = band * 24 + bit;
        if (y >= dots || !qrDark(symbol.modules, count, quiet, scale, x, y)) continue;
        slice[x * 3 + (bit >> 3)] |= 0x80 >> (bit & 7);
      }
    }
    parts.push(Buffer.from([0x1b, 0x2a, 0x21, dots & 0xff, (dots >> 8) & 0xff]), slice, Buffer.from([0x0a]));
  }

  parts.push(Buffer.from([0x1b, 0x32]));
  return Buffer.concat(parts);
}

function qrDark(
  modules: { get: (row: number, col: number) => number },
  count: number,
  quiet: number,
  scale: number,
  x: number,
  y: number,
) {
  const column = Math.floor(x / scale) - quiet;
  const row = Math.floor(y / scale) - quiet;
  if (column < 0 || row < 0 || column >= count || row >= count) return false;
  return Boolean(modules.get(row, column));
}
