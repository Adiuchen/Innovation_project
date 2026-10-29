import os from "node:os";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSessionProfile, type Profile } from "@/lib/auth";
import { printPlantQr } from "@/lib/printer";

export const runtime = "nodejs";

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
  if (!/^plant-[a-z0-9]{8}$/i.test(qrCode)) {
    return NextResponse.json({ error: "That plant does not have a QR code." }, { status: 400 });
  }

  const { data: plant } = await supabase
    .from("public_plant_pages")
    .select("qr_code, plant_id, plant_name")
    .eq("qr_code", qrCode)
    .maybeSingle();

  if (!plant?.qr_code) {
    return NextResponse.json({ error: "That plant does not have a QR code." }, { status: 404 });
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const label = String(plant.plant_id || plant.plant_name || plant.qr_code).slice(0, 32);

  try {
    await printPlantQr({
      url: `${proto}://${reachableHost(host)}/p/${plant.qr_code}`,
      label,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The printer did not print.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
