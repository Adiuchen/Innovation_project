import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { imageContentType, PHOTO_BUCKET, storageObjectPath } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^E\d{1,6}$/.test(id)) return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const storagePath = await findImagePath(supabase, id);
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

async function findImagePath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
) {
  const published = await supabase.from("public_events").select("image_path").eq("id", id).maybeSingle();
  if (published.data?.image_path) return published.data.image_path;

  const staff = await supabase.from("events").select("image_path").eq("id", id).maybeSingle();
  return staff.data?.image_path ?? null;
}
