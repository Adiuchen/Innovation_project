"use server";

import { createClient as createAuthClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { numberOrNull, textOrNull } from "@/lib/format";
import { getCopy } from "@/lib/i18n";

function authEmail(loginId: string) {
  if (loginId.includes("@")) return loginId;
  return `${loginId.toLowerCase()}@staff.plantrecords.com`;
}

function nextLoginId(emails: Array<string | null>, role: string) {
  const prefix = role === "conservation_officer" ? "O" : "B";
  let max = 0;
  for (const email of emails) {
    const match = String(email ?? "").toUpperCase().match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export async function createAccount(formData: FormData) {
  const { supabase } = await requireUser(["administrator"]);
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "botanist");
  const { t } = await getCopy();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin?error=" + encodeURIComponent(t.invalidEmail));
  }

  if (role !== "botanist" && role !== "conservation_officer") {
    redirect("/admin?error=" + encodeURIComponent("Choose Botanist or Officer."));
  }

  const { data: existing } = await supabase.from("profiles").select("id");
  const loginId = nextLoginId((existing ?? []).map((row) => row.id), role);

  const signupClient = createAuthClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await signupClient.auth.signUp({
    email: authEmail(loginId),
    password,
  });
  if (error || !data.user) {
    const message = error?.message?.includes("rate limit")
      ? "Supabase blocked this account because it tried to email a confirmation. In Supabase, open Authentication, then Providers, then Email, and turn off Confirm email. Then create the account again."
      : (error?.message ?? "Could not create login");
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    uuid: data.user.id,
    id: loginId,
    name: fullName,
    email: email || null,
    role,
    status: "active",
  });

  if (profileError) {
    redirect(`/admin?error=${encodeURIComponent(profileError.message)}`);
  }
  redirect(`/admin?created=${loginId}`);
}

export async function updateAccount(formData: FormData) {
  const { supabase } = await requireUser(["administrator"]);
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (status !== "active" && status !== "suspended") {
    redirect("/admin?error=" + encodeURIComponent("Choose active or suspended."));
  }

  const { data: target } = await supabase.from("profiles").select("role").eq("uuid", id).maybeSingle();
  if (!target) {
    redirect("/admin?error=" + encodeURIComponent("Account not found."));
  }

  let role = target.role;
  if (target.role === "botanist" || target.role === "conservation_officer") {
    const nextRole = String(formData.get("role"));
    if (nextRole !== "botanist" && nextRole !== "conservation_officer") {
      redirect("/admin?error=" + encodeURIComponent("Choose Botanist or Officer."));
    }
    role = nextRole;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, status })
    .eq("uuid", id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin");
}

export async function createSensor(formData: FormData) {
  const { supabase } = await requireUser(["administrator"]);
  const { error } = await supabase.from("sensors").insert({
    name: String(formData.get("name") || "").trim(),
    plant_record_id: textOrNull(formData.get("plant_record_id")),
    latitude: numberOrNull(formData.get("latitude")),
    longitude: numberOrNull(formData.get("longitude")),
    status: "online",
    last_seen_at: new Date().toISOString(),
  });
  if (error) redirect(`/admin/iot?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/iot");
}

export async function addReading(formData: FormData) {
  const { supabase, user } = await requireUser(["administrator"]);
  const sensorId = String(formData.get("sensor_id"));
  const temperature = numberOrNull(formData.get("temperature"));
  const humidity = numberOrNull(formData.get("humidity"));
  const movement = formData.get("movement_detected") === "on";
  const latitude = numberOrNull(formData.get("latitude"));
  const longitude = numberOrNull(formData.get("longitude"));

  const { data: sensor } = await supabase
    .from("sensors")
    .select("latitude, longitude")
    .eq("id", sensorId)
    .maybeSingle();

  const { error } = await supabase.from("sensor_readings").insert({
    sensor_id: sensorId,
    temperature,
    humidity,
    movement_detected: movement,
    latitude,
    longitude,
  });
  if (error) redirect(`/admin/iot?error=${encodeURIComponent(error.message)}`);

  await supabase
    .from("sensors")
    .update({ status: "online", last_seen_at: new Date().toISOString() })
    .eq("id", sensorId);

  const alerts: { alert_type: string; message: string }[] = [];
  if (humidity != null && humidity < 40) {
    alerts.push({ alert_type: "dry_condition", message: `Humidity is ${humidity}%.` });
  }
  if (temperature != null && temperature > 35) {
    alerts.push({ alert_type: "high_temperature", message: `Temperature is ${temperature}°C.` });
  }
  if (movement) {
    alerts.push({ alert_type: "possible_disturbance", message: "Movement was detected near the plant." });
  }
  if (
    sensor?.latitude != null &&
    sensor.longitude != null &&
    latitude != null &&
    longitude != null &&
    (Math.abs(sensor.latitude - latitude) > 0.001 || Math.abs(sensor.longitude - longitude) > 0.001)
  ) {
    alerts.push({ alert_type: "possible_theft", message: "The sensor location changed." });
  }

  if (alerts.length > 0) {
    await supabase.from("alerts").insert(
      alerts.map((alert) => ({ ...alert, sensor_id: sensorId, handled_by: null })),
    );
  }

  void user;
  redirect("/admin/iot");
}

export async function markOffline(formData: FormData) {
  const { supabase } = await requireUser(["administrator"]);
  const sensorId = String(formData.get("sensor_id"));
  await supabase.from("sensors").update({ status: "offline" }).eq("id", sensorId);
  await supabase.from("alerts").insert({
    sensor_id: sensorId,
    alert_type: "sensor_offline",
    message: "The sensor stopped sending data.",
  });
  redirect("/admin/iot");
}

export async function handleAlert(formData: FormData) {
  const { supabase, user } = await requireUser(["administrator"]);
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await supabase
    .from("alerts")
    .update({ status, handled_by: user.id, handled_at: new Date().toISOString() })
    .eq("id", id);
  redirect("/admin/iot");
}
