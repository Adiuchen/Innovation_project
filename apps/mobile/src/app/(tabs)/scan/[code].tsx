import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Button, Fact, Loading, Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { choiceLabel, firstParam, healthChoices, recordName } from "@/lib/plant";
import { lookupTag, type TagHit } from "@/lib/sync";
import { colors } from "@/theme";

export default function TaggedPlantScreen() {
  const { code: rawCode } = useLocalSearchParams<{ code: string }>();
  const code = decodeURIComponent(firstParam(rawCode));
  const { online } = useAuth();
  const [hit, setHit] = useState<TagHit | null>(null);

  useEffect(() => {
    let cancelled = false;
    lookupTag(code, online)
      .then((result) => {
        if (!cancelled) setHit(result);
      })
      .catch(() => {
        if (!cancelled) setHit({ kind: "missing", offline: !online });
      });
    return () => {
      cancelled = true;
    };
  }, [code, online]);

  if (!hit) return <Loading label="Looking up this tag…" />;

  if (hit.kind === "missing") {
    return (
      <Screen>
        <Notice tone="warn">
          {hit.offline
            ? "This tag is not saved on the phone. Connect and scan it again."
            : `No published plant was found for ${code}.`}
        </Notice>
      </Screen>
    );
  }

  if (hit.kind === "record") {
    const record = hit.record;
    return (
      <Screen>
        <Text style={styles.name}>{recordName(record.plant_name, record.species_name)}</Text>
        <Fact label="Tag" value={code} />
        <Fact label="Place" value={record.location_name} />
        <Fact label="Health" value={choiceLabel(record.health_status, healthChoices)} />
        <Fact label="GPS" value={record.latitude != null ? `${record.latitude}, ${record.longitude}` : null} />
        {record.user_id ? <Button label="Open field record" onPress={() => router.push(`/records/${record.uuid}`)} /> : null}
      </Screen>
    );
  }

  const plant = hit.plant;
  const names = [plant.common_name, plant.local_name].filter(Boolean).join(" · ");

  return (
    <Screen>
      <Text style={styles.rank}>{[plant.family, plant.genus].filter(Boolean).join(" · ")}</Text>
      <Text style={styles.name}>{plant.scientific_name || "Tagged plant"}</Text>
      {names ? <Text style={styles.meta}>{names}</Text> : null}
      <Fact label="Tag" value={plant.qr_code} />
      <Fact label="Conservation status" value={plant.conservation_status} />
      <Fact label="Distribution" value={plant.distribution} />
      <Fact label="Description" value={plant.description} />
      <Fact label="Ecology" value={plant.ecological_info} />
      <Fact label="Cultural significance" value={plant.cultural_significance} />
      <Fact label="Health of this plant" value={plant.health_status} />
      <PhotoGallery photos={hit.photos} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rank: { color: colors.leaf, fontWeight: "700" },
  name: { fontSize: 28, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 15 },
});
