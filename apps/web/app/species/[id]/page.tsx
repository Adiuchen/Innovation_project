import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { PhotoList } from "@/components/PhotoList";
import { getCopy } from "@/lib/i18n";

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: species } = await supabase.from("species").select("*").eq("uuid", id).is("hidden_at", null).maybeSingle();
  if (!species) notFound();
  const { t } = await getCopy();

  const publicPhotos = await supabase
    .from("public_species_photos")
    .select("id, storage_path, caption")
    .eq("species_id", id);
  const { data: photos } = publicPhotos.error
    ? await supabase
        .from("plant_photos")
        .select("id, storage_path, caption")
        .eq("species_id", id)
        .is("plant_record_id", null)
        .is("hidden_at", null)
    : publicPhotos;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-8">
      <PageHeading backHref="/" backLabel={t.backPage} title={species.scientific_name} titleClassName="text-3xl font-semibold" />
      <article className="surface px-6 py-7">
      <p className="text-sm font-medium text-forest">{[species.family, species.genus].filter(Boolean).join(" · ")}</p>
      <p className="mt-1 text-neutral-700">
        {[species.common_name, species.local_name].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-5 space-y-3 text-sm">
        <Info label={t.conservationStatus} value={species.conservation_status} />
        <Info label={t.distribution} value={species.distribution} />
        <Info label={t.description} value={species.description} />
        <Info label={t.ecology} value={species.ecological_info} />
        <Info label={t.cultural} value={species.cultural_significance} />
      </div>
      <PhotoList photos={photos ?? []} />
      </article>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="font-medium">{label}</p>
      <p className="whitespace-pre-wrap text-neutral-700">{value}</p>
    </div>
  );
}
