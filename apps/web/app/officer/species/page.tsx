import Link from "next/link";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { deleteSpecies } from "../actions";

export default async function SpeciesListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const { data, error } = await supabase
    .from("species")
    .select("uuid, id, scientific_name, common_name, conservation_status")
    .is("hidden_at", null)
    .order("scientific_name");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading
        backHref="/dashboard"
        backLabel={t.backPage}
        title={t.species}
        extra={<Link className="btn" href="/officer/species/new">{t.addSpecies}</Link>}
      />
      {(error || actionError) && <p className="mt-3 text-sm text-red-700">{error?.message || actionError}</p>}
      <ul className="mt-4 divide-y surface">
        {(data ?? []).map((item) => (
          <li key={item.uuid} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{item.id} · {item.scientific_name}</p>
              <p className="text-sm text-neutral-600">
                {item.common_name || t.noCommonName} · {item.conservation_status || t.statusNotSet}
              </p>
            </div>
            <div className="flex gap-2">
              <Link className="inline-flex items-center rounded border px-3 py-1 text-sm" href={`/officer/species/${item.uuid}`}>
                {t.edit}
              </Link>
              <ConfirmDelete
                action={deleteSpecies}
                id={item.uuid}
                next="/officer/species"
                label={t.delete}
                title={t.confirmDeleteTitle}
                message={`${item.id} · ${item.scientific_name}. ${t.confirmDeleteText}`}
                confirmLabel={t.confirm}
                cancelLabel={t.cancel}
                className="rounded border border-red-300 px-3 py-1 text-sm text-red-800"
              />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
