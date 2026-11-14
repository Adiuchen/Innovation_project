type SpeciesJoin = {
  scientific_name?: string | null;
  common_name?: string | null;
  local_name?: string | null;
  family?: string | null;
  genus?: string | null;
  conservation_status?: string | null;
};

type NameJoin = { name?: string | null };

type RareListRow = {
  id: string | null;
  plant_name: string | null;
  location_name: string | null;
  recorded_at: string | null;
  species: SpeciesJoin | SpeciesJoin[] | null;
  profiles: NameJoin | NameJoin[] | null;
};

export type StaffListPlant = {
  plant_id: string;
  plant_name: string | null;
  scientific_name: string | null;
  common_name: string | null;
  local_name: string | null;
  location_name: string | null;
  recorded_by: string | null;
  recorded_at: string | null;
};

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

type RecordsClient = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export async function listRareApproved(supabase: RecordsClient): Promise<StaffListPlant[]> {
  const { data, error } = await supabase
    .from("plant_records")
    .select(
      "id, plant_name, location_name, recorded_at, species(scientific_name, common_name, local_name), profiles!plant_records_botanist_id_fkey(name)",
    )
    .eq("status", "approved")
    .eq("visibility", "rare");
  if (error || !data) return [];
  return data.flatMap((row) => {
    if (!row.id) return [];
    const species = one(row.species);
    const botanist = one(row.profiles);
    return [
      {
        plant_id: row.id,
        plant_name: row.plant_name,
        scientific_name: species?.scientific_name ?? null,
        common_name: species?.common_name ?? null,
        local_name: species?.local_name ?? null,
        location_name: row.location_name,
        recorded_by: botanist?.name ?? null,
        recorded_at: row.recorded_at,
      },
    ];
  });
}

export async function listStaffPlants(supabase: RecordsClient): Promise<{ plants: StaffListPlant[]; error: string | null }> {
  const { data, error } = await supabase
    .from("public_plant_pages")
    .select("plant_id, plant_name, scientific_name, common_name, local_name, location_name, recorded_by, recorded_at")
    .order("recorded_at", { ascending: false });
  if (error) return { plants: [], error: error.message };

  const published = (data ?? []).flatMap((plant) => (plant.plant_id ? [plant as StaffListPlant] : []));
  const rare = await listRareApproved(supabase);
  const seen = new Set(published.map((plant) => plant.plant_id));
  return {
    plants: [...published, ...rare.filter((plant) => plant.plant_id && !seen.has(plant.plant_id))],
    error: null,
  };
}

export async function loadRarePlant(supabase: RecordsClient, plantId: string) {
  const { data, error } = await supabase
    .from("plant_records")
    .select(
      "uuid, id, qr_code, plant_name, life_stage, location_name, latitude, longitude, height_m, health_status, recorded_at, species(scientific_name, common_name, local_name, family, genus, conservation_status), profiles!plant_records_botanist_id_fkey(name)",
    )
    .eq("id", plantId)
    .eq("status", "approved")
    .eq("visibility", "rare")
    .maybeSingle();
  if (error || !data) return null;

  const species = one(data.species as SpeciesJoin | SpeciesJoin[] | null);
  const botanist = one(data.profiles as NameJoin | NameJoin[] | null);
  const photos = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("plant_record_id", String(data.uuid))
    .is("hidden_at", null);

  return {
    plant: {
      plant_id: typeof data.id === "string" ? data.id : plantId,
      qr_code: typeof data.qr_code === "string" ? data.qr_code : null,
      plant_name: typeof data.plant_name === "string" ? data.plant_name : null,
      life_stage: typeof data.life_stage === "string" ? data.life_stage : null,
      scientific_name: species?.scientific_name ?? null,
      common_name: species?.common_name ?? null,
      local_name: species?.local_name ?? null,
      family: species?.family ?? null,
      genus: species?.genus ?? null,
      conservation_status: species?.conservation_status ?? null,
      location_name: typeof data.location_name === "string" ? data.location_name : null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
      height_m: typeof data.height_m === "number" ? data.height_m : null,
      health_status: typeof data.health_status === "string" ? data.health_status : null,
      recorded_at: typeof data.recorded_at === "string" ? data.recorded_at : null,
      recorded_by: botanist?.name ?? null,
    },
    photos: photos.error ? [] : (photos.data ?? []),
  };
}
