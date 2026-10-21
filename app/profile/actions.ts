"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getCopy, type Locale } from "@/lib/i18n";

export type SaveEmailState = {
  error?: string;
  saved?: boolean;
  email?: string;
  name?: string;
} | null;

export async function saveEmail(_prev: SaveEmailState, formData: FormData): Promise<SaveEmailState> {
  const { supabase, profile } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  const { t } = await getCopy();
  if (!name) return { error: t.nameRequired };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t.invalidEmail };

  const { data, error } = await supabase
    .from("profiles")
    .update({ name, email })
    .eq("uuid", profile.uuid)
    .select("email, name")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data?.email) return { error: t.emailNotSaved };

  revalidatePath("/", "layout");
  return { saved: true, email: data.email, name: data.name };
}

export async function setLocale(formData: FormData) {
  const locale: Locale = formData.get("locale") === "ms" ? "ms" : "en";
  const store = await cookies();
  store.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
