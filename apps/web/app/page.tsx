import Link from "next/link";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { healthLabels, optionLabel } from "@/lib/field-choices";
import { getCopy } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; code?: string }>;
}) {
  const params = await searchParams;
  const { t } = await getCopy();
  if (params.code) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-sm text-neutral-600">{t.openingLink}</p>
      </main>
    );
  }
  const q = params.q;
  const query = (q ?? "").trim();
  const term = query.replace(/[%_,.()"'\\]/g, "");
  const supabase = await createClient();

  let request = supabase
    .from("public_plant_pages")
    .select("qr_code, plant_id, plant_name, scientific_name, common_name, local_name, conservation_status, health_status")
    .order("plant_name")
    .limit(50);

  if (term) {
    const pattern = `"%${term}%"`;
    request = request.or(
      ["plant_id", "plant_name", "scientific_name", "common_name", "local_name"]
        .map((column) => `${column}.ilike.${pattern}`)
        .join(","),
    );
  }

  const { data: plants, error } = await request;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="surface px-6 py-8">
        <p className="text-sm font-medium text-forest">{t.publicKnowledge}</p>
        <h1 className="mt-1 text-3xl font-semibold">{t.findSpecies}</h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-600">{t.searchHint}</p>
        <form className="mt-5 flex gap-2" action="/">
          <input
            className="w-full rounded-lg border px-3 py-2"
            name="q"
            defaultValue={query}
            placeholder={t.searchPlants}
          />
          <button className="btn" type="submit">
            {t.search}
          </button>
        </form>
      </section>
      <UpcomingEvents />
      {error && <p className="mt-4 text-sm text-red-700">{error.message}</p>}
      <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-950/15 bg-white shadow-sm">
      <ul className="scroll-box max-h-[32rem] space-y-3 overflow-auto p-3">
        {(plants ?? []).map((item) => (
          <li key={item.qr_code}>
            <Link href={`/p/${item.qr_code}`} className="surface block px-5 py-4 transition hover:bg-emerald-50">
              <span className="font-medium">
                {[item.plant_id, item.plant_name || item.scientific_name || t.unidentifiedPlant].filter(Boolean).join(" · ")}
              </span>
              <span className="mt-1 block text-sm text-neutral-600">
                {[item.plant_name ? item.scientific_name : null, item.common_name, item.local_name].filter(Boolean).join(" · ") || t.noCommonName}
              </span>
              <span className="mt-1 block text-sm">
                {item.conservation_status || t.statusNotSet}
                {item.health_status ? ` · ${t.health}: ${optionLabel(item.health_status, healthLabels(t))}` : ""}
              </span>
            </Link>
          </li>
        ))}
        {!error && (plants ?? []).length === 0 && (
          <li className="surface px-5 py-8 text-sm text-neutral-500">{query ? t.noSearchResults : t.noSpeciesYet}</li>
        )}
      </ul>
      </div>
    </main>
  );
}
