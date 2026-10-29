import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { printPlantQr } from "@/lib/printer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { supabase, user, profile } = await getSessionProfile();
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
      url: `${proto}://${host}/p/${plant.qr_code}`,
      label,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The printer did not print.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
