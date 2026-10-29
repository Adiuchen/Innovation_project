"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { abortReset, requestResetCode, updateResetPassword, type ResetState } from "@/app/login/reset/actions";
import type { Copy } from "@/lib/i18n";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ResetPasswordForm({
  t,
  ready,
  linkError,
}: {
  t: Copy;
  ready: boolean;
  linkError: boolean;
}) {
  const [step, setStep] = useState<"email" | "sent" | "password">(ready ? "password" : "email");
  const [email, setEmail] = useState("");
  const [mailing, setMailing] = useState(false);
  const [mailError, setMailError] = useState("");
  const sentFor = useRef("");
  const [sendState, sendAction, sending] = useActionState(requestResetCode, null as ResetState);
  const [passwordState, passwordAction, saving] = useActionState(updateResetPassword, null as ResetState);

  useEffect(() => {
    if (!sendState?.ok || sendState.step !== "pending" || !sendState.email || !sendState.ticket) return;
    if (sentFor.current === sendState.ticket) return;
    sentFor.current = sendState.ticket;
    const ticketEmail = sendState.email;
    setMailing(true);
    setMailError("");

    const supabase = createBrowserSupabase();
    void supabase.auth
      .signInWithOtp({
        email: ticketEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin,
        },
      })
      .then(async ({ error }) => {
        if (error) {
          await abortReset();
          const wait = error.message.match(/after (\d+) seconds/i);
          setMailError(
            wait
              ? t.resetWait.replace("{seconds}", wait[1])
              : /rate limit/i.test(error.message)
                ? t.resetHourlyLimit
                : t.resetSendFailed,
          );
          setMailing(false);
          return;
        }
        setEmail(ticketEmail);
        setStep("sent");
        setMailing(false);
      });
  }, [sendState, t.resetHourlyLimit, t.resetSendFailed, t.resetWait]);

  useEffect(() => {
    if (passwordState?.step === "password") setStep("password");
    if (passwordState?.error && !passwordState.step) setStep("email");
  }, [passwordState]);

  const notice =
    step === "password"
      ? passwordState?.error
      : mailError || (step === "email" ? sendState?.error || (linkError ? t.codeExpired : undefined) : undefined);

  return (
    <div className="surface w-full p-8">
      <h1 className="text-2xl font-semibold">{t.resetPassword}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {step === "email" ? t.resetIntro : step === "sent" ? t.codePrompt : t.newPassword}
      </p>
      {email && step === "sent" && <p className="mt-2 text-sm font-medium">{email}</p>}
      {notice && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{notice}</p>}

      {step === "email" && (
        <form action={sendAction} className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            {t.email}
            <input className="mt-1 w-full rounded-lg border px-3 py-2" name="email" type="email" autoComplete="email" required />
          </label>
          <button className="btn w-full" type="submit" disabled={sending || mailing}>
            {sending || mailing ? t.saving : t.sendCode}
          </button>
        </form>
      )}

      {step === "sent" && (
        <form action={sendAction} className="mt-5">
          <input type="hidden" name="email" value={email} />
          <button className="btn w-full" type="submit" disabled={sending || mailing}>
            {sending || mailing ? t.saving : t.resendCode}
          </button>
        </form>
      )}

      {step === "password" && (
        <form action={passwordAction} className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            {t.newPassword}
            <input className="mt-1 w-full rounded-lg border px-3 py-2" name="password" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          <label className="block text-sm font-medium">
            {t.confirmPassword}
            <input className="mt-1 w-full rounded-lg border px-3 py-2" name="confirm_password" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          <button className="btn w-full" type="submit" disabled={saving}>{saving ? t.saving : t.resetPassword}</button>
        </form>
      )}

      <Link className="mt-4 inline-block text-sm font-medium text-forest" href="/login">{t.backToLogin}</Link>
    </div>
  );
}
