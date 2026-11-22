import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Badge, Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getSpecies, listRecords } from "@/lib/db";
import { firstParam } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";
import { colors, conservationColors } from "@/theme";
import type { CachedRecord, Species } from "@/types";

export default function SpeciesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const speciesId = firstParam(id);
  const { profile, version } = useAuth();
  const { t } = usePreferences();
  const [species, setSpecies] = useState<Species | null>(null);
  const [records, setRecords] = useState<CachedRecord[]>([]);
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

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    listRecords(profile.uuid)
      .then((rows) => {
        if (!cancelled) setRecords(rows.filter((row) => row.species_id === speciesId));
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, speciesId, version]);

  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">This species is not in the guide saved on this phone.</Notice>
      </Screen>
    );
  }
  if (!species) return null;

  const rank = [species.family, species.genus].filter(Boolean).join(" · ");
  const names = [species.common_name, species.local_name].filter(Boolean).join(" · ");
  const tone = species.conservation_status ? conservationColors(species.conservation_status) : null;

  return (
    <Screen>
      {species.photos.length > 0 ? <PhotoGallery photos={species.photos} height={240} radius={20} /> : null}
      <View style={styles.heading}>
        {rank ? <Text style={styles.rank}>{rank}</Text> : null}
        <Text style={styles.name}>{species.scientific_name}</Text>
        {names ? <Text style={styles.names}>{names}</Text> : null}
        <View style={styles.chips}>
          <Text style={styles.code}>{species.code}</Text>
          {species.conservation_status && tone ? (
            <Text style={[styles.status, { backgroundColor: tone.background, color: tone.text }]}>{species.conservation_status}</Text>
          ) : null}
        </View>
      </View>
      {species.description ? <Text style={styles.lead}>{species.description}</Text> : null}
      {species.distribution || species.ecological_info ? (
        <View style={styles.card}>
          <Note label={t.distribution} value={species.distribution} />
          <Note label={t.ecology} value={species.ecological_info} />
        </View>
      ) : null}
      {species.cultural_significance ? (
        <View style={styles.card}>
          <Note label={t.cultural} value={species.cultural_significance} />
        </View>
      ) : null}
      {records.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.section}>{t.recordedPlants}</Text>
          {records.map((item) => (
            <Pressable
              key={item.uuid}
              accessibilityRole="button"
              onPress={() => router.push(`/records/${item.uuid}`)}
              style={({ pressed }) => [styles.record, pressed && styles.recordPressed]}
            >
              <View style={styles.recordCopy}>
                <Text style={styles.recordName}>{recordTitle(item)}</Text>
                {item.location_name ? <Text style={styles.recordPlace}>{item.location_name}</Text> : null}
              </View>
              <Badge status={item.status} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function recordTitle(item: CachedRecord) {
  return item.plant_name || item.code || item.qr_code || "Recorded plant";
}

function Note({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.note}>
      <Text style={styles.noteLabel}>{label}</Text>
      <Text style={styles.noteBody}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 4 },
  rank: { color: colors.leaf, fontSize: 14, fontWeight: "600" },
  name: { color: colors.ink, fontSize: 30, fontStyle: "italic", fontWeight: "600", lineHeight: 36 },
  names: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 },
  code: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.field,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  status: {
    overflow: "hidden",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lead: { color: colors.ink, fontSize: 17, lineHeight: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 16,
  },
  note: { gap: 4 },
  noteLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  noteBody: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  section: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  record: { flexDirection: "row", alignItems: "center", gap: 12 },
  recordPressed: { opacity: 0.6 },
  recordCopy: { flex: 1, gap: 2 },
  recordName: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  recordPlace: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
