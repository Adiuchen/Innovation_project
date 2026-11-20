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
  const external = externalImage(storagePath);
  if (external) return external;
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
    if (table === "plant_photos") {
      const pending = await supabase
        .from("plant_photos")
        .select("storage_path")
        .eq("id", id)
        .not("pending_update_id", "is", null)
        .maybeSingle();
      if (!pending.error && pending.data?.storage_path) return pending.data.storage_path;
    }
  }
  return null;
}

function externalImage(storagePath: string | null) {
  if (!storagePath || !/^https:\/\//i.test(storagePath)) return null;
  let url: URL;
  try {
    url = new URL(storagePath);
  } catch {
    return null;
  }
  if (!/\.(jpe?g|png|gif|webp)$/i.test(url.pathname)) return null;
  return fetch(url, {
    headers: { "User-Agent": "PlantRecords/1.0 (university field catalogue)" },
    redirect: "follow",
  }).then(async (response) => {
    if (!response.ok) return new NextResponse("Not found", { status: 404 });
    const type = response.headers.get("content-type") || "";
    return new NextResponse(new Uint8Array(await response.arrayBuffer()), {
      headers: {
        "Content-Type": type.startsWith("image/") ? type : imageContentType(url.pathname),
        "Cache-Control": "public, max-age=86400",
      },
    });
  });
}
