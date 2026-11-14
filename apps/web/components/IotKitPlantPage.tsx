import { OfficerIot } from "@/components/OfficerIot";
import { requireUser, type Profile } from "@/lib/auth";
import { kitPlantId, loadIotKitPlantId } from "@/lib/iot-kit";
import { getCopy } from "@/lib/i18n";

export async function IotKitPlantPage({
  roles,
  basePath,
  id,
}: {
  roles: Profile["role"][];
  basePath: string;
  id: string;
}) {
  const { supabase } = await requireUser(roles);
  const { t } = await getCopy();
  const plantId = kitPlantId(decodeURIComponent(id));
  const kit = await loadIotKitPlantId(supabase);

  if (plantId && kit.plantId === plantId) {
    return <OfficerIot backHref={basePath} />;
  }

  return (
    <main className="grid min-h-[calc(100dvh-4.5rem)] place-items-center px-6">
      <p className="text-center text-3xl font-semibold tracking-tight sm:text-xl sm:font-medium sm:tracking-normal">{t.noSetup}</p>
    </main>
  );
}
