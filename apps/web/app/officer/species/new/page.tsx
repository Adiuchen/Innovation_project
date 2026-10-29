import { PageHeading } from "@/components/PageHeading";
import { SpeciesForm } from "@/components/SpeciesForm";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { createSpecies } from "../../actions";

export default async function NewSpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireUser(["conservation_officer"]);
  const { t } = await getCopy();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-8">
      <PageHeading backHref="/officer/species" backLabel={t.backPage} title={t.addSpecies} />
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <SpeciesForm action={createSpecies} />
    </main>
  );
}
