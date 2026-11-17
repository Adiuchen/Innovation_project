import Link from "next/link";
import { PrepareFieldCache } from "@/components/PrepareFieldCache";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { requireUser, type Profile } from "@/lib/auth";
import { getCopy, statusText, type Copy } from "@/lib/i18n";
import { updatesSchemaMissing } from "@/lib/plant-update";

function cards(t: Copy): Record<Profile["role"], { href: string; title: string }[]> {
  return {
    botanist: [
      { href: "/botanist", title: t.myRecords },
      { href: "/botanist/new", title: t.newRecord },
      { href: "/botanist/plants", title: t.viewPlants },
      { href: "/botanist/iot", title: t.iotDashboard },
    ],
    conservation_officer: [
      { href: "/officer", title: t.reviewRecords },
      { href: "/officer/plants", title: t.viewPlants },
      { href: "/officer/species", title: t.species },
      { href: "/officer/map", title: t.map },
      { href: "/officer/iot", title: t.iotDashboard },
      { href: "/officer/events", title: t.events },
    ],
    administrator: [
      { href: "/admin", title: t.manageUsers },
      { href: "/admin/events", title: t.events },
      { href: "/admin/iot", title: t.iot },
    ],
    guide: [
      { href: "/guide", title: t.speciesGuide },
      { href: "/", title: t.findSpecies },
    ],
    visitor: [],
  };
}

export default async function DashboardPage() {
  const { supabase, profile } = await requireUser(["botanist", "conservation_officer", "administrator", "guide"]);
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
  let recordsToUpdate = 0;
  if (profile.role === "botanist") {
    const { count } = await supabase
      .from("plant_records")
      .select("uuid", { count: "exact", head: true })
      .eq("botanist_id", profile.uuid)
      .in("status", ["needs_revision", "rejected"]);
    const updates = await supabase
      .from("plant_updates")
      .select("uuid", { count: "exact", head: true })
      .eq("botanist_id", profile.uuid)
      .eq("status", "open");
    const updateCount = updatesSchemaMissing(updates.error) ? 0 : (updates.count ?? 0);
    recordsToUpdate = (count ?? 0) + updateCount;
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
        <PrepareFieldCache quiet readyLabel={t.fieldPhoneReady} failedLabel={t.fieldPhoneFailed} />
      )}
      <ul className={`mt-6 grid items-stretch gap-3 ${items.length >= 6 ? "grid-cols-2 lg:grid-cols-3" : items.length >= 5 ? "grid-cols-2 lg:grid-cols-5" : items.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {items.map((item) => {
          const badge = item.href === "/officer" ? pendingReviews : item.href === "/botanist" ? recordsToUpdate : 0;
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                className={`relative flex h-full min-h-[4.75rem] items-center justify-center rounded-2xl border px-4 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${badge > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-950/10 bg-white"}`}
              >
                {badge > 0 && (
                  <span className="absolute right-2.5 top-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
                    {badge}
                  </span>
                )}
                <span className="font-medium">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <UpcomingEvents limit={4} />
    </main>
  );
}
