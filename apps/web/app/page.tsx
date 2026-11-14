import Link from "next/link";
import { UpcomingEvents } from "@/components/UpcomingEvents";
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
    .select("qr_code, plant_name, scientific_name, common_name, local_name, conservation_status")
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
  const covers = await coverPhotos(supabase, (plants ?? []).map((item) => item.qr_code));

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
      <section className="mt-8">
        <h2 className="text-[1.375rem] font-bold">{t.guessInterest}</h2>
        <p className="mt-1 text-sm leading-5 text-neutral-600">{t.guessInterestHint}</p>
        {error && <p className="mt-4 text-sm text-red-700">{error.message}</p>}
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(plants ?? []).map((item) => {
            const title = item.plant_name || item.scientific_name || t.unidentifiedPlant;
            const subtitle = [item.plant_name ? item.scientific_name : null, item.common_name, item.local_name]
              .filter(Boolean)
              .join(" · ");
            const cover = covers.get(item.qr_code);
            return (
              <li key={item.qr_code}>
                <Link
                  href={`/p/${item.qr_code}`}
                  className="relative flex aspect-square flex-col gap-1.5 overflow-hidden rounded-[1.75rem] bg-[#143528] p-4 text-[#f7fbf8] transition hover:bg-[#1e4d38]"
                >
                  {cover && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-0 bg-[rgb(14_36_28/0.45)]" />
                    </>
                  )}
                  <span className="relative truncate text-xs font-semibold text-[#d7e6da]">
                    {item.conservation_status || t.plantCard}
                  </span>
                  <span className="relative line-clamp-3 text-[1.35rem] leading-[1.2] font-bold">{title}</span>
                  <span className="relative line-clamp-2 text-[13px] leading-snug text-white/80">
                    {subtitle || t.noCommonName}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {!error && (plants ?? []).length === 0 && (
          <p className="surface mt-4 px-5 py-8 text-sm text-neutral-500">{query ? t.noSearchResults : t.noSpeciesYet}</p>
        )}
      </section>
    </main>
  );
}

async function coverPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  codes: string[],
) {
  const covers = new Map<string, string>();
  const unique = [...new Set(codes.filter(Boolean))];
  if (unique.length === 0) return covers;

  const { data, error } = await supabase
    .from("public_plant_photos")
    .select("id, qr_code, storage_path")
    .in("qr_code", unique);
  if (error || !data) return covers;

  for (const photo of data) {
    const code = typeof photo.qr_code === "string" ? photo.qr_code : "";
    const id = typeof photo.id === "string" ? photo.id : "";
    const path = typeof photo.storage_path === "string" ? photo.storage_path : "";
    if (!code || !id || covers.has(code)) continue;
    if (!path || path.startsWith("file:") || path.startsWith("content:")) continue;
    covers.set(code, `/photos/${id}`);
  }
  return covers;
}
