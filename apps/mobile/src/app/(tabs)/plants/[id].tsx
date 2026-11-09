import { useLocalSearchParams } from "expo-router";
import ApprovedPlantsScreen from "@/app/(tabs)/plants/index";
import { useEffect, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { Linking, StyleSheet, Text, View } from "react-native";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PrintQrButton } from "@/components/PrintQrButton";
import { Button, Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { choiceLabel, firstParam, healthChoices, lifeStageChoices, plantQrValue } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";
import { loadApprovedPlant, plantTitle, type ApprovedPlantDetail } from "@/lib/publicPlants";
import { siteUrl } from "@/lib/supabase";
import { colors } from "@/theme";

export default function ApprovedPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = decodeURIComponent(firstParam(id)).trim();
  if (rawId.toLowerCase() === "index") return <ApprovedPlantsScreen />;
  return <ApprovedPlantBody plantId={rawId.toUpperCase()} />;
}

function ApprovedPlantBody({ plantId }: { plantId: string }) {
  const { profile } = useAuth();
  const { locale, t } = usePreferences();
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

  const lifeStage = choiceLabel(plant.life_stage, lifeStageChoices);
  const health = choiceLabel(plant.health_status, healthChoices);
  const coordinates = formatCoordinates(plant.latitude, plant.longitude);
  const recorded = [formatRecorded(plant.recorded_at, locale), plant.recorded_by].filter(Boolean).join(" · ");
  const commons = [plant.common_name, plant.local_name].filter(Boolean).join(" · ");
  const qrValue = plant.qr_code ? plantQrValue(plant.qr_code, siteUrl) : "";
  const mapUrl =
    plant.latitude != null && plant.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${plant.latitude}&mlon=${plant.longitude}#map=17/${plant.latitude}/${plant.longitude}`
      : null;

  return (
    <Screen>
      <View>
        {plant.photos.length > 0 ? (
          <PhotoGallery photos={plant.photos} height={240} radius={24} />
        ) : (
          <View style={styles.heroEmpty}>
            <Text style={styles.heroEmptyText}>No photograph yet</Text>
          </View>
        )}
        {qrValue ? (
          <View style={styles.qrBadge}>
            <QRCode value={qrValue} size={72} />
          </View>
        ) : null}
      </View>
      {plant.qr_code ? (
        <Text style={styles.publicPage}>
          {t.publicPage}: /p/{plant.qr_code}
        </Text>
      ) : null}
      <View style={styles.pills}>
        {plant.conservation_status ? <Text style={styles.pill}>{plant.conservation_status}</Text> : null}
        {health ? <Text style={styles.pill}>{health}</Text> : null}
      </View>
      <Text style={styles.name}>{plantTitle(plant)}</Text>
      {plant.plant_name && plant.scientific_name ? <Text style={styles.scientific}>{plant.scientific_name}</Text> : null}
      {commons ? <Text style={styles.subtitle}>{commons}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.section}>{t.classification}</Text>
        <Line label={t.family} value={plant.family} />
        <Line label={t.genus} value={plant.genus} />
        <Line label={t.scientificName} value={plant.scientific_name} italic />
        <Line label={t.conservationStatus} value={plant.conservation_status} />
        {plant.description ? <Text style={styles.body}>{plant.description}</Text> : null}
        <Text style={styles.section}>{t.thisSpecimen}</Text>
        <Line label={t.plantName} value={plant.plant_name} />
        <Line label={t.plantId} value={plant.plant_id} />
        <Line label={t.lifeStage} value={lifeStage} />
        <Line label={t.place} value={plant.location_name} />
        <Line label={t.coordinates} value={coordinates} />
        <Line label={t.height} value={plant.height_m != null ? `${plant.height_m} m` : null} />
        <Line label={t.condition} value={health} />
        <Line label={t.recorded} value={recorded || null} />
        {mapUrl ? <Button label="Open location" tone="secondary" onPress={() => Linking.openURL(mapUrl)} /> : null}
      </View>
      <PrintQrButton qrCode={plant.qr_code} />
    </Screen>
  );
}

function Line({ label, value, italic = false }: { label: string; value: string | null | undefined; italic?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineValue, italic && value ? styles.italic : null]}>{value || "—"}</Text>
    </View>
  );
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null) return null;
  const north = latitude >= 0 ? "N" : "S";
  const east = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(4)}° ${north}, ${Math.abs(longitude).toFixed(4)}° ${east}`;
}

function formatRecorded(value: string | null, locale: "en" | "zh" | "ms") {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ms" ? "ms-MY" : locale === "zh" ? "zh-CN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
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
  scientific: { color: colors.ink, fontSize: 18, fontStyle: "italic" },
  subtitle: { color: colors.muted, fontSize: 16 },
  publicPage: { color: colors.muted, fontSize: 14 },
  qrBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 6,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  section: { color: colors.ink, fontSize: 16, fontWeight: "700", marginTop: 4 },
  line: { gap: 2, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e7eee6" },
  lineLabel: { color: "#6b726c", fontSize: 13 },
  lineValue: { color: colors.ink, fontSize: 16 },
  italic: { fontStyle: "italic" },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
});
