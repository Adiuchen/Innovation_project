import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { EmergencyDesk } from "@/components/EmergencyDesk";
import { ProfilePanel, type ProfileNotice } from "@/components/ProfilePanel";
import { homeForRole, getSessionProfile, type Profile } from "@/lib/auth";
import { emergencyColumns, emergencyMissing, type EmergencyAlert } from "@/lib/emergency";
import { getCopy, statusText, type Copy } from "@/lib/i18n";
import { updatesSchemaMissing } from "@/lib/plant-update";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const { supabase, profile } = await getSessionProfile();
  const { locale, t } = await getCopy();
  const notices = profile ? await loadNotices(supabase, profile, t) : [];
  const changeCount = profile?.role === "botanist" ? notices.length : 0;
  const emergencies = profile ? await loadEmergencies(supabase, profile) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={profile ? homeForRole(profile.role) : "/"} className="flex items-center gap-2 font-semibold text-forest">
          <BrandMark />
          {t.siteName}
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {profile ? (
            <>
              {changeCount > 0 && (
                <Link href="/botanist#notices" className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-950">
                  {changeCount} {t.recordsToUpdate}
                </Link>
              )}
              <ProfilePanel profile={profile} locale={locale} t={t} roleLabel={statusText(profile.role, t)} notices={notices} />
            </>
          ) : null}
          {!profile && (
            <Link href="/login" className="btn ml-1">
              {t.login}
            </Link>
          )}
        </nav>
      </div>
      {emergencies && (profile?.role === "botanist" || profile?.role === "conservation_officer") && (
        <EmergencyDesk
          role={profile.role}
          userId={profile.uuid}
          initial={emergencies.alerts}
          locale={locale}
          t={t}
        />
      )}
    </header>
  );
}

async function loadEmergencies(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Profile,
): Promise<{ alerts: EmergencyAlert[]; ready: boolean } | null> {
  if (profile.role !== "botanist" && profile.role !== "conservation_officer") return null;
  const { data, error } = await supabase
    .from("emergency_alerts")
    .select(emergencyColumns)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (emergencyMissing(error)) return { alerts: [], ready: false };
  return { alerts: (data ?? []) as EmergencyAlert[], ready: true };
}

async function loadNotices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Profile,
  t: Copy,
): Promise<ProfileNotice[]> {
  if (profile.role === "botanist") {
    const { data } = await supabase
      .from("plant_records")
      .select("uuid, id, plant_name, status, species(scientific_name)")
      .eq("botanist_id", profile.uuid)
      .in("status", ["needs_revision", "rejected"])
      .order("recorded_at", { ascending: false });
    const recordNotices = (data ?? []).map((record) => {
      const species = Array.isArray(record.species) ? record.species[0] : record.species;
      const rejected = record.status === "rejected";
      return {
        id: record.uuid,
        href: `/botanist/${record.uuid}`,
        title: `${record.id} · ${record.plant_name || species?.scientific_name || t.unidentified}`,
        detail: rejected ? t.noticeRejected : t.noticeRevision,
        tone: rejected ? "rejected" as const : "revision" as const,
      };
    });
    const requested = await supabase
      .from("plant_updates")
      .select("uuid, plant_name, plant_records(id)")
      .eq("botanist_id", profile.uuid)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    const updateNotices = updatesSchemaMissing(requested.error)
      ? []
      : (requested.data ?? []).map((item) => {
          const linked = Array.isArray(item.plant_records) ? item.plant_records[0] : item.plant_records;
          return {
            id: item.uuid,
            href: `/botanist/updates/${item.uuid}`,
            title: [linked?.id, item.plant_name || t.unidentified].filter(Boolean).join(" · "),
            detail: t.updatesRequested,
            tone: "revision" as const,
          };
        });
    return [...updateNotices, ...recordNotices];
  }

  if (profile.role === "conservation_officer") {
    const { data } = await supabase
      .from("plant_records")
      .select("uuid, id, plant_name, species(scientific_name)")
      .eq("status", "submitted")
      .order("recorded_at", { ascending: false })
      .limit(8);
    return (data ?? []).map((record) => {
      const species = Array.isArray(record.species) ? record.species[0] : record.species;
      return {
        id: record.uuid,
        href: `/officer/records/${record.uuid}`,
        title: `${record.id} · ${record.plant_name || species?.scientific_name || t.unidentified}`,
        detail: t.submitted,
        tone: "submitted",
      };
    });
  }

  if (profile.role === "administrator") {
    const { data } = await supabase
      .from("alerts")
      .select("id, alert_type, message")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(8);
    return (data ?? []).map((alert) => ({
      id: String(alert.id),
      href: "/admin/iot",
      title: statusText(alert.alert_type, t),
      detail: alert.message,
      tone: "alert",
    }));
  }

  return [];
}
