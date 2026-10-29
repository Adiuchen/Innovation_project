import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetworkState } from "expo-network";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initDb } from "@/lib/db";
import { staffEmail } from "@/lib/plant";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { pendingCount, refreshReferenceData, syncDrafts } from "@/lib/sync";
import type { Profile } from "@/types";

const PROFILE_KEY = "plant-records-profile";
const KEEP_SIGNED_IN_KEY = "plant-records-stay-signed-in";

type AuthValue = {
  ready: boolean;
  profile: Profile | null;
  online: boolean;
  pending: number;
  notice: string | null;
  syncing: boolean;
  bootMessage: string | null;
  signIn: (loginId: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearNotice: () => void;
  version: number;
};

const AuthContext = createContext<AuthValue | null>(null);

function connectionOf(state: { isConnected?: boolean | null; isInternetReachable?: boolean | null }) {
  if (state.isConnected === false || state.isInternetReachable === false) return "offline";
  if (state.isConnected === true || state.isInternetReachable === true) return "online";
  return "unknown";
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("uuid, id, name, email, role, status")
    .eq("uuid", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Profile | null) ?? null;
}

async function readCachedProfile(userId?: string) {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw) as Profile;
    if (profile.status !== "active") return null;
    if (userId && profile.uuid !== userId) return null;
    return profile;
  } catch {
    return null;
  }
}

async function readKeptProfile() {
  const keep = await AsyncStorage.getItem(KEEP_SIGNED_IN_KEY);
  if (keep !== "1") return null;
  return readCachedProfile();
}

async function rememberProfile(profile: Profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  await AsyncStorage.setItem(KEEP_SIGNED_IN_KEY, "1");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const network = useNetworkState();
  const connection = connectionOf(network);
  const online = connection === "online";
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pending, setPending] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [bootMessage, setBootMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refreshPending = useCallback(async (userId: string) => {
    await initDb();
    setPending(await pendingCount(userId));
  }, []);

  const syncField = useCallback(
    async (current: Profile, quiet: boolean) => {
      if (!online) {
        if (!quiet) setNotice("No connection. Records stay on this phone until the network returns.");
        await refreshPending(current.uuid);
        return;
      }
      setSyncing(true);
      try {
        await initDb();
        let uploaded = 0;
        let error: string | null = null;
        if (current.role === "botanist") {
          const result = await syncDrafts(current.uuid);
          uploaded = result.uploaded;
          error = result.error;
        }
        const referenceError = await refreshReferenceData(current);
        error = error ?? referenceError;
        await refreshPending(current.uuid);
        setVersion((value) => value + 1);
        if (error) setNotice(error);
        else if (uploaded > 0) setNotice(uploaded === 1 ? "Uploaded 1 record." : `Uploaded ${uploaded} records.`);
        else if (!quiet) setNotice("Field data is up to date.");
      } finally {
        setSyncing(false);
      }
    },
    [online, refreshPending],
  );

  useEffect(() => {
    let cancelled = false;

    async function restore(userId: string | undefined) {
      try {
        await initDb();
        if (!userId) {
          const kept = await readKeptProfile();
          if (cancelled) return;
          if (kept) {
            setProfile(kept);
            await refreshPending(kept.uuid);
            setNotice("Working from the copy saved on this phone.");
          }
          return;
        }

        try {
          const fresh = await fetchProfile(userId);
          if (cancelled) return;
          if (!fresh || fresh.status !== "active") {
            await supabase.auth.signOut();
            await AsyncStorage.multiRemove([PROFILE_KEY, KEEP_SIGNED_IN_KEY]);
            setProfile(null);
            setBootMessage(fresh ? "This account is suspended." : "This login has no profile row. An administrator must add one.");
          } else {
            await rememberProfile(fresh);
            setProfile(fresh);
            await refreshPending(fresh.uuid);
          }
        } catch {
          const cached = await readCachedProfile(userId);
          if (cancelled) return;
          if (cached) {
            setProfile(cached);
            await refreshPending(cached.uuid);
            setNotice("Working from the copy saved on this phone.");
          } else {
            setBootMessage("Could not confirm this account. Connect and sign in again.");
          }
        }
      } catch {
        if (!cancelled) setBootMessage("The field book could not open its local database.");
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) return restore(data.session?.user?.id);
      })
      .catch(() => {
        if (!cancelled) return restore(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshPending]);

  const userId = profile?.uuid ?? null;

  useEffect(() => {
    if (!ready || !userId || !online) return;
    let cancelled = false;
    fetchProfile(userId)
      .then(async (fresh) => {
        if (cancelled) return;
        if (!fresh || fresh.status !== "active") {
          await supabase.auth.signOut();
          await AsyncStorage.multiRemove([PROFILE_KEY, KEEP_SIGNED_IN_KEY]);
          setProfile(null);
          setBootMessage(fresh ? "This account is suspended." : "This login has no profile row. An administrator must add one.");
          return;
        }
        await rememberProfile(fresh);
        setProfile(fresh);
        await syncField(fresh, true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [online, ready, syncField, userId]);

  const signIn = useCallback(
    async (loginId: string, password: string) => {
      if (supabaseConfigError) return supabaseConfigError;
      const { error } = await supabase.auth.signInWithPassword({
        email: staffEmail(loginId),
        password,
      });
      if (error) return error.message;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "Sign-in did not return an account.";

      let next: Profile | null = null;
      try {
        next = await fetchProfile(user.id);
      } catch (caught) {
        await supabase.auth.signOut();
        return caught instanceof Error ? caught.message : "Could not load the profile.";
      }

      if (!next) {
        await supabase.auth.signOut();
        return "This login has no profile row. An administrator must add one.";
      }
      if (next.status !== "active") {
        await supabase.auth.signOut();
        return "This account is suspended.";
      }
      if (next.role === "botanist" && loginId.includes("@")) {
        await supabase.auth.signOut();
        return "Botanists sign in with the ID issued by the administrator, not an email.";
      }

      await rememberProfile(next);
      await supabase.from("login_logs").insert({ user_id: user.id, success: true });
      setProfile(next);
      setBootMessage(null);
      await refreshPending(next.uuid);
      return null;
    },
    [refreshPending],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove([PROFILE_KEY, KEEP_SIGNED_IN_KEY]);
    setProfile(null);
    setNotice(null);
    setPending(0);
  }, []);

  const syncNow = useCallback(async () => {
    if (!profile) return;
    await syncField(profile, false);
  }, [profile, syncField]);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      profile,
      online,
      pending,
      notice,
      syncing,
      bootMessage,
      signIn,
      signOut,
      syncNow,
      clearNotice: () => setNotice(null),
      version,
    }),
    [bootMessage, notice, online, pending, profile, ready, signIn, signOut, syncNow, syncing, version],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
