import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { PlantPhoto } from "@/components/PlantPhoto";
import { Fact, Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getSpecies } from "@/lib/db";
import { speciesPhoto } from "@/lib/photo-path";
import { firstParam } from "@/lib/plant";
import { colors } from "@/theme";
import type { Species } from "@/types";

export default function SpeciesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const speciesId = firstParam(id);
  const { version } = useAuth();
  const [species, setSpecies] = useState<Species | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSpecies(speciesId).then((row) => {
      if (cancelled) return;
      setSpecies(row);
      setMissing(!row);
    });
    return () => {
      cancelled = true;
    };
  }, [speciesId, version]);

  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">This species is not in the guide saved on this phone.</Notice>
      </Screen>
    );
  }
  if (!species) return null;

  const names = [species.common_name, species.local_name].filter(Boolean).join(" · ");
  const photo = speciesPhoto(species.photos);

  return (
    <Screen>
      <Text style={styles.rank}>{[species.family, species.genus].filter(Boolean).join(" · ")}</Text>
      <Text style={styles.name}>{species.scientific_name}</Text>
      {names ? <Text style={styles.meta}>{names}</Text> : null}
      <Fact label="Code" value={species.code} />
      <Fact label="Conservation status" value={species.conservation_status} />
      <Fact label="Distribution" value={species.distribution} />
      <Fact label="Description" value={species.description} />
      <Fact label="Ecology" value={species.ecological_info} />
      <Fact label="Cultural significance" value={species.cultural_significance} />
      {photo ? <PlantPhoto photo={photo} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rank: { color: colors.leaf, fontWeight: "700" },
  name: { fontSize: 28, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 15 },
});
