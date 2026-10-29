import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { SpeciesForm } from "@/components/SpeciesForm";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { updateSpecies } from "../../actions";

export default async function EditSpeciesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const { data: species } = await supabase.from("species").select("*").eq("uuid", id).is("hidden_at", null).maybeSingle();
  if (!species) notFound();
  const { data: photos, error: photoError } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("species_id", id)
    .is("plant_record_id", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-4 pb-8">
      <PageHeading backHref="/officer/species" backLabel={t.backPage} title={t.editSpecies} />
      {(error || photoError) && <p className="mb-3 text-sm text-red-700">{error || photoError?.message}</p>}
      <SpeciesForm action={updateSpecies} species={species} photos={photos ?? []} />
    </main>
  );
}
