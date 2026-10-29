import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { Badge, Muted, Notice } from "@/components/ui";
import { listDrafts, listRecords } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { formatWhen, recordName } from "@/lib/plant";
import { colors } from "@/theme";
import type { CachedRecord, Draft } from "@/types";

const sorts = [
  { key: "recent", label: "Recent" },
  { key: "oldest", label: "Oldest" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
] as const;

type SortKey = (typeof sorts)[number]["key"];

function recordText(item: CachedRecord) {
  return `${item.code ?? ""} ${item.plant_name ?? ""} ${item.species_name ?? ""} ${item.common_name ?? ""} ${item.location_name ?? ""} ${item.status}`.toLowerCase();
}

export default function RecordsScreen() {
  const { profile, syncNow, version, pending } = useAuth();
  const { palette, t } = usePreferences();
  const [records, setRecords] = useState<CachedRecord[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  useFocusEffect(
    useCallback(() => {
      if (!profile || version < 0 || pending < 0) return;
      let cancelled = false;
      Promise.all([listRecords(profile.uuid), listDrafts(profile.uuid)])
        .then(([nextRecords, nextDrafts]) => {
          if (cancelled) return;
          setRecords(nextRecords);
          setDrafts(nextDrafts);
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }, [pending, profile, version]),
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle ? records.filter((item) => recordText(item).includes(needle)) : records;
    return [...filtered].sort((a, b) => {
      if (sort === "name") return recordName(a.plant_name, a.species_name).localeCompare(recordName(b.plant_name, b.species_name));
      if (sort === "status") return a.status.localeCompare(b.status) || (b.recorded_at ?? "").localeCompare(a.recorded_at ?? "");
      const recent = (b.recorded_at ?? "").localeCompare(a.recorded_at ?? "");
      return sort === "oldest" ? -recent : recent;
    });
  }, [query, records, sort]);

  if (!profile) return null;

  return (
    <FlatList
      style={[styles.list, { backgroundColor: palette.field }]}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(item) => item.uuid}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await syncNow();
            setRefreshing(false);
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.findRecords}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />
          <View style={styles.sorts}>
            {sorts.map((item) => {
              const selected = item.key === sort;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => setSort(item.key)}
                  style={[styles.sort, selected && styles.sortSelected]}
                >
                  <Text style={[styles.sortText, selected && styles.sortTextSelected]}>
                    {item.key === "recent" ? t.recent : item.key === "oldest" ? t.oldest : item.key === "name" ? t.name : t.status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.count}>
            {visible.length} {visible.length === 1 ? t.record : t.records}
          </Text>
          {drafts.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.heading}>{t.stillOnPhone}</Text>
              {drafts.map((draft) => (
                <Pressable key={draft.local_id} style={styles.row} onPress={() => router.push(`/records/draft/${draft.local_id}`)}>
                  <Text style={styles.name}>{recordName(draft.plant_name, draft.species_label)}</Text>
                  <Muted>{draft.sync_error || draft.location_name || t.notUploaded}</Muted>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <Notice>
          {records.length === 0
            ? profile.role === "botanist"
              ? t.noRecords
              : "Botanist field records appear here after that botanist signs in."
            : t.noMatch}
        </Notice>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/records/${item.uuid}`)}>
          <Text style={styles.name}>
            {item.code ? `${item.code} · ` : ""}
            {recordName(item.plant_name, item.species_name)}
          </Text>
          <Muted>
            {item.location_name || "No place name"}
            {item.recorded_at ? ` · ${formatWhen(item.recorded_at)}` : ""}
          </Muted>
          <Badge status={item.status} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.field },
  content: { padding: 16, gap: 10 },
  header: { gap: 12, marginBottom: 8 },
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
  sortText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  sortTextSelected: { color: "#f7fbf8" },
  count: { color: colors.muted, fontSize: 13 },
  block: { gap: 8 },
  heading: { fontSize: 16, fontWeight: "700", color: colors.ink },
  row: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  name: { color: colors.ink, fontSize: 16, fontWeight: "600" },
});
