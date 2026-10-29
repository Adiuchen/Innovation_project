import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
export const photoBucket = "plant-photos";

export const supabaseConfigError =
  supabaseUrl && supabaseAnonKey
    ? null
    : "This build is missing the Supabase URL or publishable key.";

export const supabase = createClient(supabaseUrl || "https://example.supabase.co", supabaseAnonKey || "missing", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
