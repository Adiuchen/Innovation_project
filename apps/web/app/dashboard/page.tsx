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
      { href: "/botanist/plants", title: t.viewPlants, text: t.viewPlantsText },
    ],
    conservation_officer: [
      { href: "/officer", title: t.reviewRecords, text: t.reviewRecordsText },
      { href: "/officer/plants", title: t.viewPlants, text: t.viewPlantsText },
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
  const { supabase, profile } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const { t } = await getCopy();
  const items = cards(t)[profile.role];
  let pendingReviews = 0;
  if (profile.role === "conservation_officer") {
    const { count } = await supabase
      .from("plant_records")
      .select("uuid", { count: "exact", head: true })
      .eq("status", "submitted");
    pendingReviews = count ?? 0;
  }

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
      <ul className={`mt-6 grid items-stretch gap-3 ${items.length >= 6 ? "grid-cols-2 lg:grid-cols-3" : items.length >= 5 ? "grid-cols-2 lg:grid-cols-5" : items.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {items.map((item) => {
          const waiting = item.href === "/officer" && pendingReviews > 0;
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                className={`relative block h-full rounded-2xl border px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${waiting ? "border-amber-200 bg-amber-50 pr-8" : "border-emerald-950/10 bg-white"}`}
              >
                {waiting && (
                  <span className="absolute right-2.5 top-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
                    {pendingReviews}
                  </span>
                )}
                <span className="font-medium">{item.title}</span>
                <span className="mt-0.5 block text-sm leading-5 text-neutral-600">{item.text}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <UpcomingEvents limit={4} />
    </main>
  );
}
