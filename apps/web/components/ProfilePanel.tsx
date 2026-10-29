"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { saveEmail, setLocale, type SaveEmailState } from "@/app/profile/actions";
import type { Copy, Locale } from "@/lib/i18n";

type ProfileSummary = {
  name: string;
  id: string;
  email: string | null;
  role: string;
};

export type ProfileNotice = {
  id: string;
  href: string;
  title: string;
  detail: string;
  tone: "rejected" | "revision" | "submitted" | "alert";
};

export function ProfilePanel({
  profile,
  locale,
  t,
  roleLabel,
  notices,
}: {
  profile: ProfileSummary;
  locale: Locale;
  t: Copy;
  roleLabel: string;
  notices: ProfileNotice[];
}) {
  const [state, formAction, pending] = useActionState(saveEmail, null as SaveEmailState);
  const email = state?.email ?? profile.email;
  const name = state?.name ?? profile.name;
  const initial = (name || "?").slice(0, 1).toUpperCase();

  return (
    <>
      <button
        id="profile-trigger"
        className="relative inline-flex items-center gap-2 rounded-full border border-emerald-950/15 bg-white px-3 py-1.5 hover:bg-emerald-50"
        type="button"
        popoverTarget="profile-menu"
        popoverTargetAction="toggle"
      >
        {t.profile}
        {notices.length > 0 ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {notices.length}
          </span>
        ) : !email ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600" />
        ) : null}
      </button>
      <div id="profile-menu" popover="auto" role="menu">
        <div className="flex min-h-0 shrink flex-col px-3 pt-3">
          <div className="flex shrink-0 items-center justify-between gap-2 px-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                <BellIcon />
              </span>
              {t.notifications}
            </p>
            {notices.length > 0 && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80">
                {notices.length}
              </span>
            )}
          </div>
          {notices.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-white/50">{t.noNotifications}</p>
          ) : (
            <ul className="mt-2 mb-3 max-h-60 min-h-0 shrink space-y-1.5 overflow-y-auto rounded-xl border border-white/15 p-1.5">
              {notices.map((notice) => {
                const tone = toneStyle[notice.tone] ?? toneStyle.alert;
                const { code, name } = noticeParts(notice.title);
                const showDetail = notice.detail !== t.noticeRejected
                  && notice.detail !== t.noticeRevision
                  && notice.detail !== t.submitted;
                return (
                  <li key={notice.id}>
                    <Link
                      href={notice.href}
                      className="flex gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold leading-5">{name}</span>
                            {code && <span className="mt-0.5 block text-[11px] tracking-wide text-white/45">{code}</span>}
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ${tone.badge}`}>
                            {tone.label(t)}
                          </span>
                        </span>
                        {showDetail && (
                          <span className="mt-1 block text-xs leading-relaxed text-white/60">{notice.detail}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <form action={formAction} className="shrink-0 space-y-2 border-t border-white/10 px-3 py-3">
          {!email && <p className="text-xs text-amber-200">{t.emailReminder}</p>}
          {state?.saved && <p className="text-xs text-emerald-300">{t.profileSaved}</p>}
          {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
          <label className="block text-xs text-white/60">
            {t.fullName}
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-white px-2 py-1.5 text-sm text-ink"
              name="name"
              type="text"
              defaultValue={name}
              key={name}
              maxLength={80}
              required
            />
          </label>
          <label className="block text-xs text-white/60">
            {t.personalEmail}
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-white px-2 py-1.5 text-sm text-ink"
              name="email"
              type="email"
              placeholder="name@gmail.com"
              defaultValue={email ?? ""}
              key={email ?? ""}
              required
            />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? t.saving : t.save}
          </button>
        </form>
        <form action={setLocale} className="shrink-0 border-t border-white/10 px-3 py-3">
          <label className="block text-xs text-white/60">
            {t.language}
            <select
              className="mt-1 w-full rounded-lg border border-white/15 bg-white px-2 py-1.5 text-sm text-ink"
              name="locale"
              defaultValue={locale}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="en">{t.english}</option>
              <option value="ms">{t.malay}</option>
            </select>
          </label>
        </form>
        <div className="flex shrink-0 items-center gap-3 border-t border-white/10 px-3 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-700 text-sm font-semibold">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-white/60">{profile.id} · {roleLabel}</p>
          </div>
          <form action={logout}>
            <button className="rounded-lg px-2 py-1 text-sm text-white/80 hover:bg-white/10" type="submit">
              {t.logout}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const toneStyle = {
  rejected: {
    dot: "bg-red-400",
    badge: "bg-red-500/20 text-red-100",
    label: (t: Copy) => t.rejected,
  },
  revision: {
    dot: "bg-amber-300",
    badge: "bg-amber-400/20 text-amber-50",
    label: (t: Copy) => t.changesRequested,
  },
  submitted: {
    dot: "bg-emerald-300",
    badge: "bg-emerald-400/15 text-emerald-50",
    label: (t: Copy) => t.submitted,
  },
  alert: {
    dot: "bg-sky-300",
    badge: "bg-sky-400/15 text-sky-50",
    label: (t: Copy) => t.open,
  },
} as const;

function noticeParts(title: string) {
  const split = title.split(" · ");
  if (split.length < 2) return { code: "", name: title };
  return { code: split[0] ?? "", name: split.slice(1).join(" · ") };
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
