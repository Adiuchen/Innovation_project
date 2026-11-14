import os from "node:os";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSessionProfile, type Profile } from "@/lib/auth";
import { plantTagCode } from "@/lib/plant-access";
import { printPlantQr } from "@/lib/printer";

export const runtime = "nodejs";

function privateIpv4(value: unknown) {
  if (typeof value !== "string" || !/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return null;
  const parts = value.split(".").map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  const [first, second] = parts;
  const local = first === 10 || (first === 192 && second === 168) || (first === 172 && second >= 16 && second <= 31);
  return local ? value : null;
}

function pageOrigin(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname !== "localhost" && !privateIpv4(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function requestedPort(value: unknown) {
  if (value == null || value === "") return undefined;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return port;
}

function reachableHost(host: string) {
  const bracket = host.match(/^\[([^\]]+)\](?::(\d+))?$/);
  const name = bracket ? bracket[1] : host.replace(/:\d+$/, "");
  const port = bracket?.[2] ?? host.match(/:(\d+)$/)?.[1];
  const loopback = name === "localhost" || name === "127.0.0.1" || name === "::1";
  if (!loopback) return host;

  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .flatMap((item) => (item && !item.internal && item.family === "IPv4" ? [item.address] : []));
  const lan =
    addresses.find((ip) => ip.startsWith("192.168.") || ip.startsWith("10.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) ??
    addresses[0];
  if (!lan) return host;
  return port ? `${lan}:${port}` : lan;
}

async function caller(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return getSessionProfile();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("uuid, id, name, email, role, status")
    .eq("uuid", user.id)
    .maybeSingle();

  return { supabase, user, profile: profile as Profile | null };
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await caller(request);
  if (!user || !profile || profile.status !== "active") {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (profile.role !== "botanist" && profile.role !== "conservation_officer") {
    return NextResponse.json({ error: "Only a botanist or officer can print a plant QR." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const qrCode = typeof body?.qrCode === "string" ? body.qrCode.trim() : "";
  const recordId = typeof body?.recordId === "string" ? body.recordId.trim() : "";
  if (!/^plant-[a-z0-9]{8}$/i.test(qrCode)) {
    return NextResponse.json({ error: "That plant does not have a QR code." }, { status: 400 });
  }

  const { data: plant } = await supabase
    .from("public_plant_pages")
    .select("qr_code, plant_id, plant_name")
    .eq("qr_code", qrCode)
    .maybeSingle();

  let labelSource = plant
    ? { qr_code: plant.qr_code as string, plant_id: plant.plant_id, plant_name: plant.plant_name }
    : null;
  if (!labelSource?.qr_code && /^[0-9a-f-]{36}$/i.test(recordId)) {
    const { data: owned } = await supabase
      .from("plant_records")
      .select("qr_code, id, plant_name, local_id, uuid")
      .eq("uuid", recordId)
      .maybeSingle();
    const tag = owned ? plantTagCode(owned) : null;
    if (owned && tag && tag.toLowerCase() === qrCode.toLowerCase()) {
      labelSource = { qr_code: tag, plant_id: owned.id, plant_name: owned.plant_name };
    }
  }
  if (!labelSource?.qr_code) {
    const { data: record } = await supabase
      .from("plant_records")
      .select("qr_code, id, plant_name, local_id, uuid")
      .eq("qr_code", qrCode)
      .maybeSingle();
    if (record) {
      labelSource = {
        qr_code: plantTagCode(record) || qrCode,
        plant_id: record.id,
        plant_name: record.plant_name,
      };
    }
  }
  if (!labelSource?.qr_code) {
    const rpc = await supabase.rpc("resolve_plant_tag", { code: qrCode });
    const row = Array.isArray(rpc.data) ? rpc.data[0] : null;
    if (row && typeof row.status === "string") {
      const tag = typeof row.qr_code === "string" && row.qr_code ? row.qr_code : qrCode;
      labelSource = { qr_code: tag, plant_id: null, plant_name: null };
    }
  }
  if (!labelSource?.qr_code) {
    return NextResponse.json({ error: "That plant does not have a QR code." }, { status: 404 });
  }

  const printerHost = privateIpv4(body?.host);
  const printerPort = requestedPort(body?.port);
  if ((body?.host != null && body.host !== "" && !printerHost) || printerPort === null) {
    return NextResponse.json({ error: "Enter a printer address on this local network." }, { status: 400 });
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const origin = pageOrigin(body?.pageUrl) ?? `${proto}://${reachableHost(host)}`;
  const label = String(labelSource.plant_id || labelSource.plant_name || labelSource.qr_code).slice(0, 32);

  try {
    const bytes = await printPlantQr({
      url: `${origin}/p/${labelSource.qr_code}`,
      label,
      host: printerHost ?? undefined,
      port: printerPort,
    });
    return NextResponse.json({ ok: true, bytes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The printer did not print.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
