"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isGmailAddress } from "@/lib/format";
import { getCopy } from "@/lib/i18n";
import {
  consumeExpired,
  finishChallenge,
  finishResetForUser,
  isPendingResetUser,
  readChallenge,
  resetCookieName,
  resetReadyCookieName,
  sendResetCode,
  startChallenge,
} from "@/lib/password-reset";
import { createClient } from "@/lib/supabase/server";

export type ResetState = {
  error?: string;
  ok?: boolean;
  step?: "pending" | "password";
  email?: string;
  ticket?: string;
} | null;

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(email: string) {
  return isGmailAddress(email);
}

async function setResetCookie(id: string) {
  const jar = await cookies();
  jar.set(resetCookieName(), id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function requestResetCode(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const { t } = await getCopy();
  const email = normalizeEmail(formData.get("email"));
  if (!validEmail(email)) return { error: t.gmailRequired };

  const sent = await sendResetCode(email);
  if ("error" in sent) {
    if (sent.error === "missing") return { error: t.resetEmailMissing };
    if (sent.error === "suspended") return { error: t.resetSuspended };
    if (sent.error === "setup") return { error: t.resetSetup };
    return { error: t.resetSendFailed };
  }

  const id = randomUUID();
  startChallenge(id, sent);
  await setResetCookie(id);
  return { ok: true, step: "pending", email, ticket: id };
}

export async function abortReset() {
  const jar = await cookies();
  const id = jar.get(resetCookieName())?.value;
  if (id) await consumeExpired(id);
  jar.delete(resetCookieName());
}

export async function updateResetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const { t } = await getCopy();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPendingResetUser(user.id)) return { error: t.codeExpired };

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");
  if (password.length < 6) return { error: t.passwordShort, step: "password" };
  if (password !== confirm) return { error: t.passwordMismatch, step: "password" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message, step: "password" };

  const jar = await cookies();
  const id = jar.get(resetCookieName())?.value;
  const restored = id && readChallenge(id) ? await finishChallenge(id) : await finishResetForUser(user.id);
  if (!restored) return { error: t.resetSendFailed, step: "password" };

  jar.delete(resetCookieName());
  jar.delete(resetReadyCookieName());
  await supabase.auth.signOut();
  redirect("/login?reset=1");
}
