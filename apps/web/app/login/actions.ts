"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, type Profile } from "@/lib/auth";

function authEmail(loginId: string) {
  return `${loginId.toLowerCase()}@staff.plantrecords.com`;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const loginId = String(formData.get("login_id") || "").trim();
  const password = String(formData.get("password") || "");
  const usedEmail = loginId.includes("@");

  if (!loginId) {
    redirect("/login?error=" + encodeURIComponent("Enter a staff ID or a Gmail address."));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: usedEmail ? loginId.toLowerCase() : authEmail(loginId),
    password,
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("uuid", user!.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    redirect(
      "/login?error=" +
        encodeURIComponent("This login has no profile row. An administrator must add one."),
    );
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    redirect("/login?error=" + encodeURIComponent("This account is suspended."));
  }

  if (profile.role === "administrator" && !usedEmail) {
    await supabase.auth.signOut();
    redirect("/login?error=" + encodeURIComponent("Administrators sign in with their Gmail address."));
  }

  if (profile.role !== "administrator" && usedEmail) {
    await supabase.auth.signOut();
    redirect("/login?error=" + encodeURIComponent("Botanists and officers sign in with a staff ID, such as B004."));
  }

  await supabase.from("login_logs").insert({ user_id: user!.id, success: true });
  redirect(homeForRole(profile.role as Profile["role"]));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
