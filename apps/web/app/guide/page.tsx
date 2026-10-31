import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

type SpeciesRow = {
  uuid: string;
  id: string;
  scientific_name: string;
  common_name: string | null;
  local_name: string | null;
  family: string | null;
  conservation_status: string | null;
  description: string | null;
  ecological_info: string | null;
  cultural_significance: string | null;
};

// Read-only species guide for park guides. Staff can open it too.
export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; family?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireUser(["guide", "conservation_officer", "botanist", "administrator"]);
  const { t } = await getCopy();

  const { data, error } = await supabase
    .from("species")
    .select("uuid, id, scientific_name, common_name, local_name, family, conservation_status, description, ecological_info, cultural_significance")
    .is("hidden_at", null)
    .order("scientific_name");
  const all = (data ?? []) as SpeciesRow[];

  const families = unique(all.map((item) => item.family));
  const statuses = unique(all.map((item) => item.conservation_status));
  const query = (params.q ?? "").trim().toLowerCase();
  const family = params.family ?? "";
  const status = params.status ?? "";

  const shown = all.filter((item) => {
    if (family && item.family !== family) return false;
    if (status && item.conservation_status !== status) return false;
    if (!query) return true;
    return [
      item.id,
      item.scientific_name,
      item.common_name,
      item.local_name,
      item.family,
      item.description,
      item.ecological_info,
      item.cultural_significance,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/dashboard" backLabel={t.backPage} title={t.speciesGuide} />
      <p className="mt-1 text-sm text-neutral-600">{t.guideIntro}</p>

      <form action="/guide" className="mt-4 grid gap-2 surface p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <input className="rounded-lg border px-3 py-2" name="q" defaultValue={params.q ?? ""} placeholder={t.guideSearch} />
        <select className="rounded-lg border px-3 py-2" name="family" defaultValue={family}>
          <option value="">{t.allFamilies}</option>
          {families.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select className="rounded-lg border px-3 py-2" name="status" defaultValue={status}>
          <option value="">{t.allStatuses}</option>
          {statuses.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <button className="btn" type="submit">{t.search}</button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error.message}</p>}
      <p className="mt-4 text-sm text-neutral-600">{t.speciesCount.replace("{count}", String(shown.length))}</p>

      <ul className="mt-2 space-y-3">
        {shown.map((item) => (
          <li key={item.uuid}>
            <Link href={`/species/${item.uuid}`} className="surface block px-5 py-4 transition hover:bg-emerald-50">
              <span className="font-medium italic">{item.scientific_name}</span>
              <span className="mt-1 block text-sm text-neutral-600">
                {[item.common_name, item.local_name, item.family].filter(Boolean).join(" · ") || t.noCommonName}
              </span>
              <span className="mt-1 block text-sm">{item.conservation_status || t.statusNotSet}</span>
              {item.cultural_significance && (
                <span className="mt-2 block text-sm text-neutral-700">
                  <span className="font-medium">{t.talkingPoint}: </span>
                  {shorten(item.cultural_significance)}
                </span>
              )}
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="surface px-5 py-8 text-sm text-neutral-500">{t.noSearchResults}</li>}
      </ul>
    </main>
  );
}

function unique(values: (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))].sort();
}

function shorten(text: string, max = 160) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
