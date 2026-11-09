import { createRequire } from "node:module";
import net from "node:net";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode") as {
  create: (text: string, options: { errorCorrectionLevel: "M" }) => {
    modules: { size: number; get: (row: number, col: number) => boolean };
  };
};
const iconv = require("iconv-lite") as { encode: (text: string, encoding: string) => Buffer };

const PRINTER_TIMEOUT_MS = 8000;

export async function printPlantQr(input: { url: string; label: string; host?: string; port?: number }) {
  const ip = input.host || process.env.PRINTER_IP || "192.168.0.138";
  const portNumber = input.port ?? Number(process.env.PRINTER_PORT || "9100");
  const port = Number.isFinite(portNumber) ? portNumber : 9100;
  const payload = buildTicket(input.url, input.label);
  let bytesWritten = 0;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const socket = net.connect({ host: ip, port });
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        socket.destroy();
        const message = error instanceof Error ? error.message : "Could not connect to the printer.";
        reject(new Error(message));
        return;
      }
      resolve();
    };
    const timer = setTimeout(() => {
      finish(new Error(`Printer at ${ip}:${port} did not respond.`));
    }, PRINTER_TIMEOUT_MS);

    socket.once("error", (error) => finish(error));
    socket.once("connect", () => {
      socket.write(payload, () => {
        setTimeout(() => {
          if (!socket.destroyed) socket.end();
        }, 400);
      });
    });
    socket.once("close", () => {
      bytesWritten = socket.bytesWritten;
      finish();
    });
  });
  return bytesWritten;
}

/** Same ticket as the website: centered double-size label, QR, then a full cut. */
function buildTicket(url: string, label: string) {
  const text = label.slice(0, 32);
  return Buffer.concat([
    Buffer.from([0x1b, 0x40, 0x1b, 0x4d, 0x00, 0x1b, 0x61, 0x01]),
    Buffer.from([0x1b, 0x45, 0x00, 0x1b, 0x35, 0x1b, 0x2d, 0x00]),
    Buffer.from([0x1b, 0x21, 0x00, 0x1b, 0x21, 0x30]),
    iconv.encode(`${text}\n\n\n`, "gb18030"),
    rasterQr(url),
    Buffer.from("\n\n\n\n\n\n"),
    Buffer.from([0x1d, 0x56, 0x00]),
  ]);
}

function rasterQr(text: string) {
  const symbol = QRCode.create(text, { errorCorrectionLevel: "M" });
  const count = symbol.modules.size;
  const quiet = 2;
  let scale = 9;
  while ((count + quiet * 2) * scale > 384 && scale > 3) scale -= 1;
  const dots = (count + quiet * 2) * scale;
  const widthBytes = Math.ceil(dots / 8);
  const rows = Buffer.alloc(widthBytes * dots);
  for (let y = 0; y < dots; y += 1) {
    for (let x = 0; x < dots; x += 1) {
      const column = Math.floor(x / scale) - quiet;
      const row = Math.floor(y / scale) - quiet;
      if (column < 0 || row < 0 || column >= count || row >= count) continue;
      if (!symbol.modules.get(row, column)) continue;
      rows[y * widthBytes + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return Buffer.concat([
    Buffer.from([0x1d, 0x76, 0x30, 0x00, widthBytes & 0xff, (widthBytes >> 8) & 0xff, dots & 0xff, (dots >> 8) & 0xff]),
    rows,
  ]);
}
