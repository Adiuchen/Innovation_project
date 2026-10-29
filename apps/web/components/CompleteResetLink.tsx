"use client";

import { useEffect, useRef } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function CompleteResetLink() {
  const started = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if ((!code && !accessToken) || started.current) return;
    started.current = true;

    const supabase = createBrowserSupabase();
    const go = (path: string) => {
      window.location.assign(path);
    };
    const finish = (error: { message: string } | null) => {
      go(error ? "/login/reset?error=link" : "/login/reset");
    };

    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then(({ error }) => finish(error));
      return;
    }

    void supabase.auth
      .setSession({ access_token: accessToken!, refresh_token: refreshToken || "" })
      .then(({ error }) => finish(error));
  }, []);

  return null;
}
