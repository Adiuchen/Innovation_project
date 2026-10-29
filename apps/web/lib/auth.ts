import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  uuid: string;
  id: string;
  name: string;
  email: string | null;
  role: "botanist" | "conservation_officer" | "administrator" | "visitor";
  status: "active" | "suspended";
};

export function homeForRole(role: Profile["role"]) {
  if (role === "botanist" || role === "conservation_officer" || role === "administrator") {
    return "/dashboard";
  }
  return "/";
}

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("uuid, id, name, email, role, status")
    .eq("uuid", user.id)
    .maybeSingle();

  return { supabase, user, profile: profile as Profile | null };
}

export async function requireUser(roles?: Profile["role"][]) {
  const { supabase, user, profile } = await getSessionProfile();

  if (!user || !profile || profile.status !== "active") {
    redirect("/login");
  }

  if (roles && !roles.includes(profile.role)) {
    redirect(homeForRole(profile.role));
  }

  return { supabase, user, profile };
}
