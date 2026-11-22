"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { emergencyMissing } from "@/lib/emergency";

export async function resolveEmergency(id: string) {
  const { supabase, profile } = await requireUser(["botanist", "conservation_officer"]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "That emergency could not be found." };
  let request = supabase.from("emergency_alerts").update({ status: "resolved" }).eq("uuid", id).eq("status", "open");
  if (profile.role === "botanist") request = request.eq("botanist_id", profile.uuid);
  const { error } = await request;
  if (error) return { error: emergencyMissing(error) ? "setup" : error.message };
  revalidatePath("/", "layout");
  return { error: null };
}
