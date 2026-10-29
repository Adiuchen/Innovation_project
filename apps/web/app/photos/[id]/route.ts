import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { imageContentType, PHOTO_BUCKET, storageObjectPath } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const storagePath = await findStoragePath(supabase, id);
  const path = storagePath ? storageObjectPath(storagePath) : "";
  if (!path) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(path);
  if (error || !data) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(await data.arrayBuffer()), {
    headers: {
      "Content-Type": imageContentType(path, data.type),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

async function findStoragePath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
) {
  const tables = ["plant_photos", "public_plant_photos", "public_species_photos"] as const;
  for (const table of tables) {
    const query = supabase.from(table).select("storage_path").eq("id", id);
    const { data, error } = table === "plant_photos"
      ? await query.is("hidden_at", null).maybeSingle()
      : await query.maybeSingle();
    if (!error && data?.storage_path) return data.storage_path;
  }
  return null;
}
