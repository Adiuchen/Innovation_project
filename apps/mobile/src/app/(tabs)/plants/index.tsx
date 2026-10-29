import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Muted, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { formatWhen } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";
import { listApprovedPlants, plantTitle, type ApprovedPlant } from "@/lib/publicPlants";
import { colors } from "@/theme";

const sorts = ["newest", "oldest", "name", "place"] as const;
type SortKey = (typeof sorts)[number];

function canView(role: string | undefined) {
  return role === "botanist" || role === "conservation_officer";
}

export default function ApprovedPlantsScreen() {
  const { profile } = useAuth();
  const { palette, t } = usePreferences();
  const [plants, setPlants] = useState<ApprovedPlant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    if (!canView(profile?.role)) return;
    let cancelled = false;
    listApprovedPlants()
      .then((rows) => {
        if (!cancelled) setPlants(rows);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : t.noApprovedPlants);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.role, t.noApprovedPlants]);

  const visible = useMemo(() => {
    const rows = plants ?? [];
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((plant) =>
          `${plant.plant_id} ${plant.plant_name ?? ""} ${plant.scientific_name ?? ""} ${plant.common_name ?? ""} ${plant.local_name ?? ""} ${plant.location_name ?? ""} ${plant.recorded_by ?? ""}`
            .toLowerCase()
            .includes(needle),
        )
      : rows;
    return [...filtered].sort((a, b) => {
      if (sort === "name") return plantTitle(a).localeCompare(plantTitle(b));
      if (sort === "place") return (a.location_name ?? "").localeCompare(b.location_name ?? "");
      const recent = (b.recorded_at ?? "").localeCompare(a.recorded_at ?? "");
      return sort === "oldest" ? -recent : recent;
    });
  }, [plants, query, sort]);

  if (!profile) return null;
  if (!canView(profile.role)) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.field }]}>
        <Notice>Approved plants are available to botanists and conservation officers.</Notice>
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.screen, { backgroundColor: palette.field }]}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(item) => item.plant_id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.hint}>{t.approvedOnly}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchPlants}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />
          <View style={styles.sorts}>
            {sorts.map((item) => {
              const selected = item === sort;
              const label = item === "newest" ? t.recent : item === "oldest" ? t.oldest : item === "name" ? t.name : t.place;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() => setSort(item)}
                  style={[styles.sort, selected && styles.sortSelected]}
                >
                  <Text style={[styles.sortText, selected && styles.sortTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {error ? <Notice tone="warn">{error}</Notice> : null}
        </View>
      }
      ListEmptyComponent={plants ? <Notice>{query ? t.noMatch : t.noApprovedPlants}</Notice> : <Notice>{t.approvedOnly}</Notice>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push({ pathname: "/plants/[id]", params: { id: item.plant_id } })}>
          <Text style={styles.name}>
            {item.plant_id} · {plantTitle(item)}
          </Text>
          <Muted>
            {[item.common_name, item.location_name || null, item.recorded_by].filter(Boolean).join(" · ") || t.approvedOnly}
          </Muted>
          {item.recorded_at ? <Muted>{formatWhen(item.recorded_at)}</Muted> : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.field },
  content: { padding: 16, gap: 10 },
  header: { gap: 12, marginBottom: 4 },
  hint: { color: colors.muted, fontSize: 14 },
  search: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#f7fbf8",
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
  sorts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sort: {
    borderRadius: 999,
    backgroundColor: "#f7fbf8",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortSelected: { backgroundColor: colors.forest },
  sortText: { color: colors.forest, fontWeight: "700" },
  sortTextSelected: { color: "#f7fbf8" },
  row: { backgroundColor: "#fffcf8", borderRadius: 18, padding: 14, gap: 4 },
  name: { color: colors.ink, fontSize: 16, fontWeight: "700" },
});
