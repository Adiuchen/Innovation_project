"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function adminEventsPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "").trim();
  if (path === "/admin/events" || path.startsWith("/admin/events?")) return path;
  return "/admin/events";
}

export async function takeDownEvent(formData: FormData) {
  const { supabase } = await requireUser(["administrator"]);
  const id = String(formData.get("id") || "");
  const destination = adminEventsPath(formData.get("next"));
  if (!UUID_RE.test(id)) {
    redirect(`${destination}?error=${encodeURIComponent("Event not found.")}`);
  }

  const { data, error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("uuid", id)
    .eq("status", "published")
    .select("uuid")
    .maybeSingle();

  if (error) redirect(`${destination}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${destination}?error=${encodeURIComponent("Event not found.")}`);
  redirect(destination);
}
