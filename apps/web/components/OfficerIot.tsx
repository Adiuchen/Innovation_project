import { OfficerIotBoard } from "@/components/OfficerIotBoard";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { loadEsp32Snapshot } from "@/lib/esp32";
import { getCopy } from "@/lib/i18n";

export async function OfficerIot() {
  const { supabase } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const { locale, t } = await getCopy();
  const { error, ...initial } = await loadEsp32Snapshot(supabase);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/dashboard" backLabel={t.backPage} title={t.iotDashboard} />
      <p className="mt-1 text-sm text-neutral-600">{t.esp32Intro}</p>
      {error && <p className="mt-3 text-sm text-red-700">{error.message}</p>}
      {!error && <OfficerIotBoard initial={initial} locale={locale} t={t} />}
    </main>
  );
}
