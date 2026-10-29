import { newId } from "@/lib/id";
import { uploadPlantPhoto } from "@/lib/photos";
import { supabase } from "@/lib/supabase";

export type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  starts_at: string;
  ends_at: string | null;
  image_path: string | null;
};

export type StaffEvent = PublicEvent & {
  uuid: string;
  status: "draft" | "published" | "cancelled";
};

export type EventStatusFilter = "all" | "draft" | "published" | "cancelled";

type Row = {
  uuid?: string;
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  starts_at: string;
  ends_at: string | null;
  status?: string;
  image_path?: string | null;
};

const publicColumns = "id, title, description, location_name, starts_at, ends_at";
const staffColumns = `uuid, ${publicColumns}, status`;

function unavailableMessage(error: { message: string; code?: string }) {
  return error.code === "PGRST205" || /public_events|schema cache|could not find the table/i.test(error.message);
}

function asPublic(row: Row): PublicEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location_name: row.location_name,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    image_path: row.image_path ?? null,
  };
}

function asStaff(row: Row): StaffEvent | null {
  if (!row.uuid || (row.status !== "draft" && row.status !== "published" && row.status !== "cancelled")) return null;
  return { ...asPublic(row), uuid: row.uuid, status: row.status };
}

type QueryResult = { data: Row[] | null; error: { message: string; code?: string } | null };

function readRows(request: unknown) {
  return request as Promise<QueryResult>;
}

async function selectRows(columns: string, apply: (columns: string) => unknown) {
  const withPhoto = await readRows(apply(`${columns}, image_path`));
  if (withPhoto.error && /image_path/i.test(withPhoto.error.message)) return readRows(apply(columns));
  return withPhoto;
}

export async function listUpcomingEvents() {
  const result = await selectRows(publicColumns, (columns) =>
    supabase.from("public_events").select(columns).order("starts_at").limit(8),
  );
  if (result.error) {
    return { events: [] as PublicEvent[], error: unavailableMessage(result.error) ? null : result.error.message, unavailable: unavailableMessage(result.error) };
  }
  return { events: ((result.data ?? []) as Row[]).map(asPublic), error: null, unavailable: false };
}

export async function getPublicEvent(id: string) {
  if (!/^E\d{1,6}$/.test(id)) return { event: null, error: null };
  const withPhoto = await supabase.from("public_events").select(`${publicColumns}, image_path`).eq("id", id).maybeSingle();
  const result = withPhoto.error && /image_path/i.test(withPhoto.error.message)
    ? await supabase.from("public_events").select(publicColumns).eq("id", id).maybeSingle()
    : withPhoto;
  if (result.error) return { event: null, error: result.error.message };
  return { event: result.data ? asPublic(result.data as Row) : null, error: null };
}

export async function listStaffEvents(filter: EventStatusFilter) {
  const result = await selectRows(staffColumns, (columns) => {
    let request = supabase.from("events").select(columns).order("starts_at");
    if (filter !== "all") request = request.eq("status", filter);
    return request;
  });
  if (result.error) {
    return { events: [] as StaffEvent[], error: unavailableMessage(result.error) ? null : result.error.message, unavailable: unavailableMessage(result.error) };
  }
  return {
    events: ((result.data ?? []) as Row[]).map(asStaff).filter((item): item is StaffEvent => item != null),
    error: null,
    unavailable: false,
  };
}

export async function getStaffEvent(uuid: string) {
  const withPhoto = await supabase.from("events").select(`${staffColumns}, image_path`).eq("uuid", uuid).maybeSingle();
  const result = withPhoto.error && /image_path/i.test(withPhoto.error.message)
    ? await supabase.from("events").select(staffColumns).eq("uuid", uuid).maybeSingle()
    : withPhoto;
  if (result.error) return { event: null, error: result.error.message };
  return { event: result.data ? asStaff(result.data as Row) : null, error: null };
}

export async function saveEvent(input: {
  uuid?: string;
  userId: string;
  title: string;
  description: string | null;
  location_name: string | null;
  starts_at: string;
  ends_at: string | null;
  status: "draft" | "published";
  photoUri: string | null;
  removePhoto: boolean;
}) {
  const row = {
    title: input.title,
    description: input.description,
    location_name: input.location_name,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    status: input.status,
  };

  let uuid = input.uuid ?? null;
  if (uuid) {
    const { data, error } = await supabase.from("events").update(row).eq("uuid", uuid).select("uuid").maybeSingle();
    if (error) return { error: error.message, uuid };
    if (!data) return { error: "Event not found.", uuid: null };
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert({ ...row, created_by: input.userId })
      .select("uuid")
      .single();
    if (error || !data) return { error: error?.message ?? "Could not save the event.", uuid: null };
    uuid = data.uuid as string;
  }

  const localPhoto = input.photoUri && !input.photoUri.startsWith("http") ? input.photoUri : null;
  if (localPhoto) {
    const uploaded = await uploadPlantPhoto(input.userId, newId(), localPhoto);
    if (uploaded.error || !uploaded.url) return { error: uploaded.error ?? "Could not upload the photo.", uuid };
    const saved = await supabase.from("events").update({ image_path: uploaded.url }).eq("uuid", uuid).select("image_path").maybeSingle();
    if (saved.error) return { error: saved.error.message, uuid };
    if (!saved.data?.image_path) return { error: "Could not save the cover photo.", uuid };
  } else if (input.removePhoto) {
    const { error } = await supabase.from("events").update({ image_path: null }).eq("uuid", uuid);
    if (error) return { error: error.message, uuid };
  }

  return { error: null, uuid };
}

export async function cancelStaffEvent(uuid: string) {
  const { data, error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("uuid", uuid)
    .neq("status", "cancelled")
    .select("uuid")
    .maybeSingle();
  if (error) return error.message;
  if (!data) return "Event not found.";
  return null;
}

export async function takeDownEvent(uuid: string) {
  const { data, error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("uuid", uuid)
    .eq("status", "published")
    .select("uuid")
    .maybeSingle();
  if (error) return error.message;
  if (!data) return "Event not found.";
  return null;
}
