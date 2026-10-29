import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

const LINK_MS = 60 * 60 * 1000;
const COOKIE = "pw-reset";
const READY_COOKIE = "pw-reset-ready";
const restorePath = path.join(process.cwd(), "data", "auth-email-restore.json");

type Challenge = {
  email: string;
  originalEmail: string;
  userId: string;
  expiresAt: number;
  done: boolean;
  timer?: ReturnType<typeof setTimeout>;
};

type RestoreFile = Record<string, string>;

const memory = globalThis as typeof globalThis & {
  __pwChallenges?: Map<string, Challenge>;
  __pwOriginals?: Map<string, string>;
};

function challenges() {
  memory.__pwChallenges ??= new Map();
  return memory.__pwChallenges;
}

function originals() {
  memory.__pwOriginals ??= new Map();
  return memory.__pwOriginals;
}

function readRestoreFile(): RestoreFile {
  try {
    return JSON.parse(readFileSync(restorePath, "utf8")) as RestoreFile;
  } catch {
    return {};
  }
}

function writeRestoreFile(data: RestoreFile) {
  mkdirSync(path.dirname(restorePath), { recursive: true });
  writeFileSync(restorePath, JSON.stringify(data));
}

function rememberOriginal(userId: string, currentEmail: string, personalEmail: string) {
  const saved = originals().get(userId) ?? readRestoreFile()[userId];
  if (saved) {
    originals().set(userId, saved);
    return saved;
  }
  const original = currentEmail.toLowerCase() === personalEmail ? personalEmail : currentEmail;
  originals().set(userId, original);
  if (original.toLowerCase() !== personalEmail) {
    const file = readRestoreFile();
    file[userId] = original;
    writeRestoreFile(file);
  }
  return original;
}

async function restoreOriginal(userId: string) {
  const original = originals().get(userId) ?? readRestoreFile()[userId];
  if (!original || !userId) return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return false;
  if (data.user.email.toLowerCase() !== original.toLowerCase()) {
    const updated = await admin.auth.admin.updateUserById(userId, { email: original, email_confirm: true });
    if (updated.error) return false;
  }
  originals().delete(userId);
  const file = readRestoreFile();
  delete file[userId];
  writeRestoreFile(file);
  return true;
}

function scheduleRestore(id: string) {
  const challenge = challenges().get(id);
  if (!challenge?.userId) return;
  if (challenge.timer) clearTimeout(challenge.timer);
  const wait = Math.max(0, challenge.expiresAt - Date.now()) + 15_000;
  const timer = setTimeout(() => {
    const current = challenges().get(id);
    if (!current || current.done) return;
    void restoreOriginal(current.userId);
    challenges().delete(id);
  }, wait);
  timer.unref?.();
  challenge.timer = timer;
}

export function resetCookieName() {
  return COOKIE;
}

export function resetReadyCookieName() {
  return READY_COOKIE;
}

export function isPendingResetUser(userId: string) {
  if (!userId) return false;
  for (const challenge of challenges().values()) {
    if (challenge.userId === userId && !challenge.done) return true;
  }
  return Boolean(readRestoreFile()[userId]);
}

export async function sendResetCode(email: string) {
  const admin = createAdminClient();
  if (!admin) return { error: "setup" as const };

  const { data: rows, error: profileError } = await admin
    .from("profiles")
    .select("uuid, status, email")
    .ilike("email", email);
  if (profileError) return { error: "send" as const };

  const profile = (rows ?? []).find((row) => String(row.email ?? "").toLowerCase() === email);
  if (!profile) return { error: "missing" as const };
  if (profile.status !== "active") return { error: "suspended" as const };

  const userId = String(profile.uuid);
  const existing = await admin.auth.admin.getUserById(userId);
  if (existing.error || !existing.data.user?.email) return { error: "send" as const };

  const originalEmail = rememberOriginal(userId, existing.data.user.email, email);
  if (existing.data.user.email.toLowerCase() !== email) {
    const updated = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (updated.error) return { error: "send" as const };
  }

  return { email, originalEmail, userId };
}

export function startChallenge(id: string, sent: { email: string; originalEmail: string; userId: string }) {
  for (const [key, challenge] of challenges()) {
    if (challenge.email === sent.email) {
      if (challenge.timer) clearTimeout(challenge.timer);
      challenges().delete(key);
    }
  }
  const challenge: Challenge = {
    email: sent.email,
    originalEmail: sent.originalEmail,
    userId: sent.userId,
    expiresAt: Date.now() + LINK_MS,
    done: false,
  };
  challenges().set(id, challenge);
  scheduleRestore(id);
  return challenge.expiresAt;
}

export function readChallenge(id: string | undefined) {
  if (!id) return null;
  return challenges().get(id) ?? null;
}

export async function consumeExpired(id: string) {
  const challenge = challenges().get(id);
  if (!challenge) return;
  if (challenge.timer) clearTimeout(challenge.timer);
  if (!challenge.done) await restoreOriginal(challenge.userId);
  challenges().delete(id);
}

export async function finishChallenge(id: string) {
  const challenge = challenges().get(id);
  if (!challenge) return true;
  if (challenge.timer) clearTimeout(challenge.timer);
  const restored = await restoreOriginal(challenge.userId);
  if (!restored) {
    scheduleRestore(id);
    return false;
  }
  challenge.done = true;
  challenges().delete(id);
  return true;
}

export async function finishResetForUser(userId: string) {
  const restored = await restoreOriginal(userId);
  if (!restored) return false;
  for (const [id, challenge] of challenges()) {
    if (challenge.userId !== userId) continue;
    challenge.done = true;
    if (challenge.timer) clearTimeout(challenge.timer);
    challenges().delete(id);
  }
  return true;
}
