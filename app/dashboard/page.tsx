import Link from "next/link";
import { PrepareFieldCache } from "@/components/PrepareFieldCache";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { requireUser, type Profile } from "@/lib/auth";
import { getCopy, statusText, type Copy } from "@/lib/i18n";

function cards(t: Copy): Record<Profile["role"], { href: string; title: string; text: string }[]> {
  return {
    botanist: [
      { href: "/botanist", title: t.myRecords, text: t.myRecordsText },
      { href: "/botanist/new", title: t.newRecord, text: t.newRecordText },
    ],
    conservation_officer: [
      { href: "/officer", title: t.reviewRecords, text: t.reviewRecordsText },
      { href: "/officer/species", title: t.species, text: t.speciesText },
      { href: "/officer/map", title: t.map, text: t.mapText },
      { href: "/officer/iot", title: t.iot, text: t.iotText },
      { href: "/officer/events", title: t.events, text: t.eventsText },
    ],
    administrator: [
      { href: "/admin", title: t.users, text: t.usersText },
      { href: "/admin/events", title: t.events, text: t.adminEventsText },
      { href: "/admin/iot", title: t.iot, text: t.iotText },
    ],
    visitor: [],
  };
}

export default async function DashboardPage() {
  const { profile } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const { t } = await getCopy();
  const items = cards(t)[profile.role];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl bg-forest px-6 py-8 text-white shadow-sm">
        <p className="text-sm text-emerald-100">{t.park}</p>
        <h1 className="mt-1 text-3xl font-semibold">{t.dashboard}</h1>
        <p className="mt-3 text-sm text-emerald-50">
          {profile.name} · {profile.id}
          <span className="ml-2 rounded-full bg-white/15 px-2.5 py-0.5">{statusText(profile.role, t)}</span>
        </p>
      </section>
      {profile.role === "botanist" && (
        <PrepareFieldCache readyLabel={t.fieldPhoneReady} failedLabel={t.fieldPhoneFailed} />
      )}
      <ul className={`mt-6 grid gap-3 ${items.length >= 5 ? "grid-cols-2 lg:grid-cols-5" : items.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="surface block px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-medium">{item.title}</span>
              <span className="mt-0.5 block text-sm leading-5 text-neutral-600">{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <UpcomingEvents limit={4} />
    </main>
  );
}
