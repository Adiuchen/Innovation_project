"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { kitPlantId } from "@/lib/iot-kit";
import { listStaffPlants } from "@/lib/staff-plants";

export async function assignIotKit(plantId: string) {
  const { supabase } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const id = kitPlantId(plantId);
  if (!id) return { error: "Choose a plant." };

  const { plants, error: listError } = await listStaffPlants(supabase);
  if (listError) return { error: listError };
  if (!plants.some((plant) => kitPlantId(plant.plant_id) === id)) return { error: "That plant is not on the list." };

  const { data, error } = await supabase
    .from("iot_kit")
    .update({ plant_id: id, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("plant_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "The IoT kit record is missing. Run apps/web/supabase/iot-kit.sql in Supabase." };

  revalidatePath("/botanist/iot");
  revalidatePath("/officer/iot");
  return { error: null as string | null };
}
