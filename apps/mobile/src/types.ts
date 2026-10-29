export type Role = "botanist" | "conservation_officer" | "administrator" | "visitor";

export type Profile = {
  uuid: string;
  id: string;
  name: string;
  email: string | null;
  role: Role;
  status: "active" | "suspended";
};

export type PhotoRef = {
  storage_path: string;
  caption: string | null;
};

export type Species = {
  uuid: string;
  code: string;
  scientific_name: string;
  common_name: string | null;
  local_name: string | null;
  family: string | null;
  genus: string | null;
  description: string | null;
  conservation_status: string | null;
  distribution: string | null;
  ecological_info: string | null;
  cultural_significance: string | null;
  photos: PhotoRef[];
};

export type Draft = {
  local_id: string;
  user_id: string;
  remote_uuid: string | null;
  species_id: string | null;
  species_label: string;
  plant_name: string;
  life_stage: string;
  height_m: string;
  trunk_diameter_cm: string;
  latitude: string;
  longitude: string;
  location_name: string;
  leaf_traits: string;
  flower_fruit_traits: string;
  health_status: string;
  other_traits: string;
  photo_uri: string | null;
  photo_caption: string;
  photo_remote_url: string | null;
  status: "draft" | "submitted";
  saved_at: string;
  sync_error: string | null;
};

export type CachedRecord = {
  uuid: string;
  user_id: string;
  code: string | null;
  species_id: string | null;
  species_name: string | null;
  common_name: string | null;
  plant_name: string | null;
  life_stage: string | null;
  status: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  height_m: number | null;
  trunk_diameter_cm: number | null;
  leaf_traits: string | null;
  flower_fruit_traits: string | null;
  health_status: string | null;
  other_traits: string | null;
  qr_code: string | null;
  review_note: string | null;
  recorded_at: string | null;
  photos: PhotoRef[];
};

export type PublicPlant = {
  qr_code: string;
  scientific_name: string | null;
  common_name: string | null;
  local_name: string | null;
  family: string | null;
  genus: string | null;
  conservation_status: string | null;
  distribution: string | null;
  description: string | null;
  ecological_info: string | null;
  cultural_significance: string | null;
  health_status: string | null;
};

export type FieldInput = {
  species_id: string | null;
  species_label: string;
  plant_name: string;
  life_stage: string;
  height_m: string;
  trunk_diameter_cm: string;
  latitude: string;
  longitude: string;
  location_name: string;
  leaf_traits: string;
  flower_fruit_traits: string;
  health_status: string;
  other_traits: string;
  photo_uri: string | null;
  photo_caption: string;
  status: "draft" | "submitted";
};
