import { useLocalSearchParams } from "expo-router";
import ApprovedPlantsScreen from "@/app/(tabs)/plants/index";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Button, Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { choiceLabel, firstParam, formatWhen, healthChoices, lifeStageChoices } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";
import { loadApprovedPlant, plantSubtitle, plantTitle, type ApprovedPlantDetail } from "@/lib/publicPlants";
import { colors } from "@/theme";

export default function ApprovedPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = decodeURIComponent(firstParam(id)).trim();
  if (rawId.toLowerCase() === "index") return <ApprovedPlantsScreen />;
  return <ApprovedPlantBody plantId={rawId.toUpperCase()} />;
}

function ApprovedPlantBody({ plantId }: { plantId: string }) {
  const { profile } = useAuth();
  const { t } = usePreferences();
  const [plant, setPlant] = useState<ApprovedPlantDetail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadApprovedPlant(plantId)
      .then((result) => {
        if (!cancelled) setPlant(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setPlant(null);
          setError(cause instanceof Error ? cause.message : t.noApprovedPlants);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [plantId, t.noApprovedPlants]);

  if (!profile) return null;
  if (plant === undefined) {
    return (
      <Screen>
        <Notice>{t.approvedOnly}</Notice>
      </Screen>
    );
  }
  if (error || !plant) {
    return (
      <Screen>
        <Notice tone="warn">{error || t.noApprovedPlants}</Notice>
      </Screen>
    );
  }

  const subtitle = plantSubtitle(plant);
  const lifeStage = choiceLabel(plant.life_stage, lifeStageChoices);
  const health = choiceLabel(plant.health_status, healthChoices);
  const gps = plant.latitude != null && plant.longitude != null ? `${plant.latitude}, ${plant.longitude}` : null;

  return (
    <Screen>
      {plant.photos.length > 0 ? (
        <PhotoGallery photos={plant.photos} height={240} radius={24} />
      ) : (
        <View style={styles.heroEmpty}>
          <Text style={styles.heroEmptyText}>No photograph yet</Text>
        </View>
      )}
      <Text style={styles.name}>{plantTitle(plant)}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.pills}>
        <Text style={styles.code}>{plant.plant_id}</Text>
        {lifeStage ? <Text style={styles.pill}>{lifeStage}</Text> : null}
        {health ? <Text style={styles.pill}>{health}</Text> : null}
        {plant.conservation_status ? <Text style={styles.pill}>{plant.conservation_status}</Text> : null}
      </View>
      <View style={styles.card}>
        <Line label={t.place} value={plant.location_name} />
        <Line label="GPS" value={gps} />
        <Line label={t.recordedBy} value={plant.recorded_by} />
        <Line label="Recorded" value={plant.recorded_at ? formatWhen(plant.recorded_at) : null} />
        <Line label="Height" value={plant.height_m != null ? `${plant.height_m} m` : null} />
        <Line label="Family" value={plant.family} />
        <Line label="Genus" value={plant.genus} />
        {plant.description ? <Text style={styles.body}>{plant.description}</Text> : null}
        {gps ? (
          <Button
            label="Open location"
            tone="secondary"
            onPress={() =>
              Linking.openURL(
                `https://www.openstreetmap.org/?mlat=${plant.latitude}&mlon=${plant.longitude}#map=17/${plant.latitude}/${plant.longitude}`,
              )
            }
          />
        ) : null}
      </View>
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroEmpty: {
    height: 160,
    borderRadius: 24,
    backgroundColor: "#d7e6da",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmptyText: { color: colors.forest, fontWeight: "700" },
  name: { fontSize: 32, fontWeight: "700", color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 16, fontStyle: "italic" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  code: {
    backgroundColor: colors.forest,
    color: "#f7fbf8",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  pill: {
    backgroundColor: "#fff",
    color: colors.ink,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  card: { backgroundColor: "#fffcf8", borderRadius: 24, padding: 16, gap: 12 },
  line: { gap: 2, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e7eee6" },
  lineLabel: { color: "#6b726c", fontSize: 13 },
  lineValue: { color: colors.ink, fontSize: 16 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
});
