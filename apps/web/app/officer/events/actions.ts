"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { parseParkDateTime, textOrNull } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import { PHOTO_TOO_LARGE, PHOTO_WRONG_TYPE, uploadPlantPhoto } from "@/lib/photos";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function officerEventsPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "").trim();
  if (path === "/officer/events" || path.startsWith("/officer/events?")) return path;
  return "/officer/events";
}

async function eventRow(formData: FormData) {
  const { t } = await getCopy();
  const title = String(formData.get("title") || "").trim();
  const starts = parseParkDateTime(formData.get("starts_at"));
  const ends = parseParkDateTime(formData.get("ends_at"));
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!title) return { error: t.eventTitleRequired as string, row: null };
  if (starts === "invalid" || ends === "invalid") return { error: t.eventTimeInvalid as string, row: null };
  if (!starts) return { error: t.eventStartRequired as string, row: null };
  if (ends && ends < starts) return { error: t.eventEndBeforeStart as string, row: null };

  return {
    error: null,
    row: {
      title,
      description: textOrNull(formData.get("description")),
      location_name: textOrNull(formData.get("location_name")),
      starts_at: starts,
      ends_at: ends,
      status,
    },
  };
}

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const parsed = await eventRow(formData);
  if (!parsed.row) fail("/officer/events/new", parsed.error ?? "Could not save");
  const row = parsed.row;

  const since = new Date(Date.now() - 15_000).toISOString();
  let lookup = supabase
    .from("events")
    .select("uuid")
    .eq("created_by", user.id)
    .eq("title", row.title)
    .eq("starts_at", row.starts_at)
    .gte("created_at", since);
  lookup = row.ends_at ? lookup.eq("ends_at", row.ends_at) : lookup.is("ends_at", null);
  lookup = row.location_name ? lookup.eq("location_name", row.location_name) : lookup.is("location_name", null);
  lookup = row.description ? lookup.eq("description", row.description) : lookup.is("description", null);
  const { data: existing } = await lookup.limit(1);
  if (existing && existing.length > 0) redirect("/officer/events");

  const { data, error } = await supabase
    .from("events")
    .insert({ ...row, created_by: user.id })
    .select("uuid")
    .single();
  if (error || !data) fail("/officer/events/new", error?.message ?? "Could not save");

  const photoError = await applyEventPhoto(supabase, user.id, data.uuid, formData);
  if (photoError) fail(`/officer/events/${data.uuid}`, photoError);
  redirect("/officer/events");
}

export async function updateEvent(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id") || "");
  const path = UUID_RE.test(id) ? `/officer/events/${id}` : "/officer/events";
  if (!UUID_RE.test(id)) fail("/officer/events", "Event not found.");

  const parsed = await eventRow(formData);
  if (!parsed.row) fail(path, parsed.error ?? "Could not save");

  const { data, error } = await supabase
    .from("events")
    .update(parsed.row)
    .eq("uuid", id)
    .select("uuid")
    .maybeSingle();
  if (error) fail(path, error.message);
  if (!data) fail(path, "Event not found.");

  const photoError = await applyEventPhoto(supabase, user.id, id, formData);
  if (photoError) fail(path, photoError);
  redirect("/officer/events");
}

function coverFile(value: FormDataEntryValue | null) {
  if (typeof value !== "object" || value === null || !("arrayBuffer" in value)) return null;
  const blob = value as Blob & { name?: string };
  if (!blob.size) return null;
  if (typeof File !== "undefined" && blob instanceof File) return blob;
  return new File([blob], blob.name || "cover.jpg", { type: blob.type || "application/octet-stream" });
}

async function applyEventPhoto(
  supabase: Parameters<typeof uploadPlantPhoto>[0] & {
    from: (table: "events") => {
      update: (row: { image_path: string | null }) => {
        eq: (column: "uuid", value: string) => PromiseLike<{ error: { message: string } | null }> & {
          select: (columns: "image_path") => {
            maybeSingle: () => PromiseLike<{
              data: { image_path: string | null } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  },
  userId: string,
  eventId: string,
  formData: FormData,
) {
  const photo = coverFile(formData.get("photo"));
  if (photo) {
    const uploaded = await uploadPlantPhoto(supabase, userId, photo);
    if (uploaded.error || !uploaded.path) {
      const { t } = await getCopy();
      if (uploaded.error === PHOTO_TOO_LARGE) return t.photoTooLarge;
      if (uploaded.error === PHOTO_WRONG_TYPE) return t.photoType;
      return uploaded.error ?? "Could not upload the photo.";
    }
    const saved = await supabase
      .from("events")
      .update({ image_path: uploaded.path })
      .eq("uuid", eventId)
      .select("image_path")
      .maybeSingle();
    if (saved.error) return saved.error.message;
    if (!saved.data?.image_path) return "Could not save the cover photo.";
    return null;
  }

  if (formData.get("remove_photo") === "on") {
    const { error } = await supabase.from("events").update({ image_path: null }).eq("uuid", eventId);
    return error?.message ?? null;
  }

  return null;
}

export async function cancelEvent(formData: FormData) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id") || "");
  const destination = officerEventsPath(formData.get("next"));
  if (!UUID_RE.test(id)) fail(destination, "Event not found.");

  const { data, error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("uuid", id)
    .neq("status", "cancelled")
    .select("uuid")
    .maybeSingle();
  if (error) fail(destination, error.message);
  if (!data) fail(destination, "Event not found.");
  redirect(destination);
}
