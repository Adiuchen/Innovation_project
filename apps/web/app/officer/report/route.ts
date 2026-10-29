import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { supabase } = await requireUser(["conservation_officer"]);
  const { data, error } = await supabase
    .from("plant_records")
    .select("recorded_at, status, plant_name, life_stage, location_name, latitude, longitude, height_m, health_status, species(scientific_name, common_name)")
    .order("recorded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const lines = ["recorded_at,status,plant_name,life_stage,scientific_name,common_name,location_name,latitude,longitude,height_m,health_status"];
  for (const row of data ?? []) {
    const species = Array.isArray(row.species) ? row.species[0] : row.species;
    const cells = [
      row.recorded_at,
      row.status,
      row.plant_name,
      row.life_stage,
      species?.scientific_name,
      species?.common_name,
      row.location_name,
      row.latitude,
      row.longitude,
      row.height_m,
      row.health_status,
    ].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`);
    lines.push(cells.join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=biodiversity-report.csv",
    },
  });
}
