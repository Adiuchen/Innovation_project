import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlantPhoto } from "@/components/PlantPhoto";
import { getPublicEvent, type PublicEvent } from "@/lib/events";
import { formatParkWhen, parkStartParts } from "@/lib/park-time";
import { firstParam } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";
import { colors } from "@/theme";

export default function PublicEventScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(firstParam(rawId));
  const { locale, t } = usePreferences();
  const [event, setEvent] = useState<PublicEvent | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicEvent(id)
      .then((result) => {
        if (cancelled) return;
        setEvent(result.event);
        setError(result.error);
      })
      .catch(() => {
        if (!cancelled) {
          setEvent(null);
          setError(t.eventsUnavailable);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, t.eventsUnavailable]);

  const start = event ? parkStartParts(event.starts_at, locale) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={8}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>{t.events}</Text>
        <View style={styles.topSpacer} />
      </View>
      {event === undefined ? (
        <Text style={styles.status}>{t.upcomingEvents}</Text>
      ) : error ? (
        <Text style={styles.status}>{error}</Text>
      ) : !event ? (
        <Text style={styles.status}>{t.noUpcomingEvents}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {event.image_path ? (
            <PlantPhoto photo={{ storage_path: event.image_path, caption: null }} showCaption={false} height={280} radius={28} />
          ) : null}
          <Text style={styles.kicker}>{t.upcomingEvents}</Text>
          <Text style={styles.name}>{event.title}</Text>
          <View style={styles.when}>
            {start ? (
              <View style={styles.date}>
                <Text style={styles.month}>{start.month}</Text>
                <Text style={styles.day}>{start.day}</Text>
              </View>
            ) : null}
            <View style={styles.whenCopy}>
              <Text style={styles.whenLabel}>{t.eventWhen}</Text>
              {start ? <Text style={styles.weekday}>{start.weekday}</Text> : null}
              <Text style={styles.whenValue}>{formatParkWhen(event.starts_at, event.ends_at, locale)}</Text>
            </View>
          </View>
          {event.location_name ? (
            <View style={styles.card}>
              <Text style={styles.whenLabel}>{t.place}</Text>
              <Text style={styles.place}>{event.location_name}</Text>
            </View>
          ) : null}
          {event.description ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t.eventAbout}</Text>
              <Text style={styles.body}>{event.description}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
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
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  kicker: { color: colors.forest, fontSize: 14, fontWeight: "700" },
  name: { fontSize: 30, fontWeight: "700", color: colors.ink },
  when: { backgroundColor: "#fffcf8", borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  date: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  month: { color: "#f7fbf8", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  day: { color: "#f7fbf8", fontSize: 22, fontWeight: "700" },
  whenCopy: { flex: 1, gap: 2 },
  whenLabel: { color: "#6b726c", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  weekday: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  whenValue: { color: "#5c6560", fontSize: 14 },
  card: { backgroundColor: "#fffcf8", borderRadius: 24, padding: 16, gap: 8 },
  place: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
});
