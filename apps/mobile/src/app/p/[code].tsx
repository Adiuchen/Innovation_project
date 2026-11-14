import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useAuth } from "@/lib/auth";
import { firstParam } from "@/lib/plant";
import {
  plantSubtitle,
  plantTitle,
  resolveGuestPlantPage,
  type GuestPlantPage,
  type PublicPlantDetail,
} from "@/lib/publicPlants";
import { colors } from "@/theme";

const lifeStageLabels: Record<string, string> = {
  seedling: "Seedling",
  sapling: "Sapling",
  mature: "Mature",
  flowering: "Flowering",
  fruiting: "Fruiting",
};

export default function PublicPlantScreen() {
  const { code: rawCode } = useLocalSearchParams<{ code: string }>();
  const code = decodeURIComponent(firstParam(rawCode));
  const { online, profile } = useAuth();
  const staff =
    profile?.status === "active" &&
    (profile.role === "botanist" ||
      profile.role === "conservation_officer" ||
      profile.role === "administrator" ||
      profile.role === "guide");
  const [page, setPage] = useState<GuestPlantPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveGuestPlantPage(code, online, staff)
      .then((result) => {
        if (!cancelled) {
          setPage(result);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setPage(null);
          setError(cause instanceof Error ? cause.message : "Could not load this plant.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, online, staff]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
          hitSlop={8}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>Details</Text>
        <View style={styles.topSpacer} />
      </View>
      {page === null && !error ? (
        <Text style={styles.status}>Looking up this plant…</Text>
      ) : error ? (
        <Text style={styles.status}>
          {online ? error : "This plant is not saved on this phone. Download plant details while you have internet."}
        </Text>
      ) : page?.kind === "in_progress" ? (
        <View style={styles.progress}>
          <Text style={styles.progressTitle}>Not available yet</Text>
          <Text style={styles.progressBody}>
            This plant is not open to the public until a conservation officer approves the record.
          </Text>
          <Text style={styles.progressCode}>{code}</Text>
        </View>
      ) : page?.kind === "closed" ? (
        <View style={styles.progress}>
          <Text style={styles.progressTitle}>This plant is not open</Text>
          <Text style={styles.progressBody}>This plant is not open to the public.</Text>
        </View>
      ) : page?.kind === "missing" ? (
        <Text style={styles.status}>
          {page.offline
            ? "This plant is not saved on this phone. Download plant details while you have internet."
            : `No published plant was found for ${code}.`}
        </Text>
      ) : page?.kind === "plant" ? (
        <PlantDetails plant={page.plant} />
      ) : null}
    </SafeAreaView>
  );
}

function PlantDetails({ plant }: { plant: PublicPlantDetail }) {
  const title = plantTitle(plant);
  const subtitle = plantSubtitle(plant);
  const photos = plant.photos ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} height={280} radius={28} />
      ) : (
        <View style={[styles.hero, styles.heroEmpty]}>
          <Text style={styles.heroEmptyText}>No photograph yet</Text>
        </View>
      )}
      <Text style={styles.name}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <Text style={styles.subtitle}>No common name</Text>}
      <View style={styles.pills}>
        {plant.conservation_status ? <Text style={styles.pill}>{plant.conservation_status}</Text> : null}
        {plant.health_status ? <Text style={styles.pillMuted}>Health: {plant.health_status}</Text> : null}
        {plant.life_stage ? (
          <Text style={styles.pillMuted}>{lifeStageLabels[plant.life_stage] ?? plant.life_stage}</Text>
        ) : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>General information</Text>
        <Text style={styles.body}>{plant.description || "No description has been published for this plant yet."}</Text>
        <Fact label="Family" value={plant.family} />
        <Fact label="Genus" value={plant.genus} />
        <Fact label="Scientific name" value={plant.scientific_name} />
        <Fact label="Distribution" value={plant.distribution} />
        <Fact label="Ecology" value={plant.ecological_info} />
        <Fact label="Cultural significance" value={plant.cultural_significance} />
        <Fact label="Place" value={plant.location_name} />
        <Fact label="Height" value={plant.height_m != null ? `${plant.height_m} m` : null} />
      </View>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#e7f0e4" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  back: { fontSize: 32, lineHeight: 34, color: colors.ink, width: 36 },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  topSpacer: { width: 36 },
  status: { color: colors.muted, fontSize: 16, padding: 20 },
  progress: { padding: 24, gap: 12 },
  progressTitle: { fontSize: 32, fontWeight: "700", color: colors.ink },
  progressBody: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  progressCode: { color: colors.forest, fontSize: 15, fontWeight: "700", marginTop: 8 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  hero: { width: "100%", height: 280, borderRadius: 28, backgroundColor: "#d7e6da" },
  heroEmpty: { alignItems: "center", justifyContent: "center" },
  heroEmptyText: { color: colors.forest, fontWeight: "700" },
  name: { fontSize: 30, fontWeight: "700", color: colors.ink },
  subtitle: { color: "#5c6560", fontSize: 16 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    backgroundColor: "#e5f2ea",
    color: colors.forest,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontWeight: "700",
    fontSize: 13,
  },
  pillMuted: {
    backgroundColor: "#fff",
    color: colors.ink,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  card: {
    backgroundColor: "#fffcf8",
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  fact: { gap: 2, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e7eee6" },
  factLabel: { color: "#6b726c", fontSize: 13 },
  factValue: { color: colors.ink, fontSize: 16 },
});
