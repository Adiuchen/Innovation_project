import { FieldRecordForm } from "@/components/FieldRecordForm";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const { data: species } = await supabase
    .from("species")
    .select("uuid, id, scientific_name, common_name")
    .is("hidden_at", null)
    .order("scientific_name");

  return (
    <main className="mx-auto max-w-2xl px-4 pb-8">
      <PageHeading backHref="/botanist" backLabel={t.backPage} title={t.newFieldRecord} />
      <FieldRecordForm species={species ?? []} t={t} serverError={error} />
    </main>
  );
}
