import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Button, Loading, Notice } from "@/components/ui";
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
      <SafeAreaView style={styles.shell} edges={["top", "bottom"]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Tagged plant</Text>
          <Pressable style={styles.actionButton} onPress={() => router.push("/settings")}>
            <Text style={styles.actionButtonText}>⚙</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Notice tone="warn">
            {hit.offline
              ? "This tag is not saved on the phone. Connect and scan it again."
              : `No published plant was found for ${code}.`}
          </Notice>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (hit.kind === "record") {
    const record = hit.record;
    return (
      <SafeAreaView style={styles.shell} edges={["top", "bottom"]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Tagged plant</Text>
          <Pressable style={styles.actionButton} onPress={() => router.push("/settings")}>
            <Text style={styles.actionButtonText}>⚙</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{recordName(record.plant_name, record.species_name)}</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Tag" value={code} />
            <InfoRow label="Place" value={record.location_name} />
            <InfoRow label="Health" value={choiceLabel(record.health_status, healthChoices)} />
            <InfoRow label="GPS" value={record.latitude != null ? `${record.latitude}, ${record.longitude}` : null} />
          </View>
          {record.user_id ? <Button label="Open field record" onPress={() => router.push(`/records/${record.uuid}`)} /> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const plant = hit.plant;
  const names = [plant.common_name, plant.local_name].filter(Boolean).join(" · ");

  return (
    <SafeAreaView style={styles.shell} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Tagged plant</Text>
        <Pressable style={styles.actionButton} onPress={() => router.push("/settings")}>
          <Text style={styles.actionButtonText}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.rank}>{[plant.family, plant.genus].filter(Boolean).join(" · ")}</Text>
        <Text style={styles.name}>{plant.scientific_name || "Tagged plant"}</Text>
        {names ? <Text style={styles.meta}>{names}</Text> : null}

        <View style={styles.infoCard}>
          <InfoRow label="Tag" value={plant.qr_code ?? code} />
          <InfoRow label="Conservation status" value={plant.conservation_status} />
          <InfoRow label="Distribution" value={plant.distribution} />
          <InfoRow label="Description" value={plant.description} />
          <InfoRow label="Ecology" value={plant.ecological_info} />
          <InfoRow label="Cultural significance" value={plant.cultural_significance} />
          <InfoRow label="Health of this plant" value={plant.health_status} />
        </View>

        {hit.photos.length ? <PhotoGallery photos={hit.photos} height={220} radius={18} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: colors.paper,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(28, 25, 21, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 32,
    color: colors.ink,
    lineHeight: 32,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#123a31",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 20,
    color: "#fffdf8",
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  rank: {
    color: colors.leaf,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 4,
  },
  name: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.8,
  },
  meta: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 24,
    fontStyle: "italic",
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(28,25,21,0.06)",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  infoRow: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(28,25,21,0.05)",
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
  },
});
