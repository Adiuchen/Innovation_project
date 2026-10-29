import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvatarMenu } from "@/components/AvatarMenu";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { Badge, Notice } from "@/components/ui";
import { listDrafts, listRecords } from "@/lib/db";
import { listUpcomingEvents, type PublicEvent } from "@/lib/events";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";
import type { Palette } from "@/theme";
import type { CachedRecord, Draft } from "@/types";

export default function FieldHome() {
  const { profile, online, pending, notice, syncing, syncNow, version } = useAuth();
  const { locale, palette, t } = usePreferences();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [records, setRecords] = useState<CachedRecord[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventsNote, setEventsNote] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const result = await listUpcomingEvents();
    setEvents(result.events);
    setEventsNote(result.unavailable ? t.eventsUnavailable : result.error);
  }, [t.eventsUnavailable]);

  useEffect(() => {
    if (!profile) return;
    listRecords(profile.uuid).then((rows) => setRecords(rows.slice(0, 4))).catch(() => setRecords([]));
    listDrafts(profile.uuid).then((rows) => setDrafts(rows.slice(0, 3))).catch(() => setDrafts([]));
    listUpcomingEvents()
      .then((result) => {
        setEvents(result.events);
        setEventsNote(result.unavailable ? t.eventsUnavailable : result.error);
      })
      .catch(() => setEventsNote(t.eventsUnavailable));
  }, [profile, t.eventsUnavailable, version, pending]);

  if (!profile) return null;
  const botanist = profile.role === "botanist";
  const statusLine = !online ? t.offline : notice || t.connected;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={palette.forest}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([syncNow(), loadEvents()]);
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Niah National Park</Text>
            <Text style={styles.welcomeLabel}>{t.welcome}</Text>
            <Text style={styles.name}>{botanist ? profile.name : roleLabel(profile.role)}</Text>
            <Text style={styles.identity}>
              {profile.id} · {roleLabel(profile.role)}
            </Text>
          </View>
          <AvatarMenu name={profile.name} staffId={profile.id} />
        </View>

        <Text style={styles.status}>{statusLine}</Text>

        {botanist ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
            onPress={() => router.push("/records/new")}
          >
            <Text style={styles.primaryText}>{t.registerPlant}</Text>
          </Pressable>
        ) : (
          <Notice>Field records are collected by botanists. You can search the species guide, scan plant tags, and read upcoming events.</Notice>
        )}

        <UpcomingEvents
          title={t.upcomingEvents}
          hint={t.upcomingEventsHint}
          empty={t.noUpcomingEvents}
          events={events}
          note={eventsNote}
          locale={locale}
          manageLabel={profile.role === "conservation_officer" || profile.role === "administrator" ? t.manageEvents : undefined}
          onManage={
            profile.role === "conservation_officer" || profile.role === "administrator" ? () => router.push("/events/index") : undefined
          }
        />

        <View style={styles.tiles}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => router.push("/scan")}
          >
            <Text style={styles.tileTitle}>{t.scanTag}</Text>
            <Text style={styles.tileHint}>{t.scanHint}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => router.push("/species")}
          >
            <Text style={styles.tileTitle}>{t.species}</Text>
            <Text style={styles.tileHint}>{t.speciesHint}</Text>
          </Pressable>
          {(botanist || profile.role === "conservation_officer") && (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.tile, styles.wideTile, pressed && styles.tilePressed]}
              onPress={() => router.push("/plants" as "/plants/index")}
            >
              <Text style={styles.tileTitle}>{t.viewPlants}</Text>
              <Text style={styles.tileHint}>{t.viewPlantsHint}</Text>
            </Pressable>
          )}
        </View>

        {botanist && (
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{pending === 0 ? t.nothingToUpload : `${pending} ${t.toUpload}`}</Text>
              <Pressable accessibilityRole="button" disabled={syncing} onPress={syncNow}>
                {({ pressed }) => (
                  <Text style={[styles.link, syncing && styles.linkDisabled, pressed && styles.linkPressed]}>
                    {syncing ? t.uploading : t.upload}
                  </Text>
                )}
              </Pressable>
            </View>
            {drafts.map((draft) => (
              <Text key={draft.local_id} style={styles.line}>
                {draft.plant_name || draft.species_label || "Unidentified"}
                {draft.location_name ? ` · ${draft.location_name}` : ""}
              </Text>
            ))}
          </View>
        )}

        {botanist && records.length > 0 && (
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t.recent}</Text>
            {records.map((record) => (
              <Pressable
                key={record.uuid}
                style={({ pressed }) => [styles.record, pressed && styles.recordPressed]}
                onPress={() => router.push(`/records/${record.uuid}`)}
              >
                <Text style={styles.line}>
                  {record.code ? `${record.code} · ` : ""}
                  {record.plant_name || record.species_name || "Unidentified"}
                </Text>
                <Badge status={record.status} />
              </Pressable>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.field },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  headerCopy: { flex: 1, gap: 2 },
  kicker: { color: colors.leaf, fontSize: 13, fontWeight: "600" },
  welcomeLabel: { color: colors.muted, fontSize: 14, marginTop: 10 },
  name: { color: colors.ink, fontSize: 32, fontWeight: "700", lineHeight: 38 },
  identity: { color: colors.muted, fontSize: 14, marginTop: 2 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#f4f7f2", fontSize: 22, fontWeight: "700" },
  status: { color: colors.muted, fontSize: 14 },
  primary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryPressed: { backgroundColor: colors.forestDark },
  primaryText: { color: "#f7fbf8", fontSize: 16, fontWeight: "700" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: "46%",
    backgroundColor: colors.sheet,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 4,
  },
  tileTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  tileHint: { color: colors.muted, fontSize: 13 },
  wideTile: { flexBasis: "100%" },
  tilePressed: { backgroundColor: colors.okBg },
  sheet: {
    backgroundColor: colors.sheet,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sheetTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  link: { color: colors.forest, fontSize: 15, fontWeight: "700" },
  linkPressed: { color: colors.leaf },
  linkDisabled: { opacity: 0.5 },
  line: { color: colors.ink, fontSize: 15 },
  record: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 4, borderRadius: 12 },
  recordPressed: { backgroundColor: colors.field },
});
}
