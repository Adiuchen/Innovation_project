import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Loading, Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  cancelStaffEvent,
  listStaffEvents,
  takeDownEvent,
  type EventStatusFilter,
  type StaffEvent,
} from "@/lib/events";
import { formatParkWhen } from "@/lib/park-time";
import { usePreferences } from "@/lib/preferences";
import { statusColors } from "@/theme";

const filters: EventStatusFilter[] = ["all", "draft", "published", "cancelled"];

export default function EventsScreen() {
  const { profile } = useAuth();
  const { locale, t } = usePreferences();
  const officer = profile?.role === "conservation_officer";
  const admin = profile?.role === "administrator";
  const [filter, setFilter] = useState<EventStatusFilter>(admin && !officer ? "published" : "all");
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await listStaffEvents(admin && !officer ? "published" : filter);
    setEvents(result.events);
    setError(result.error);
    setUnavailable(result.unavailable);
    setLoading(false);
  }, [admin, filter, officer]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => setLoading(false));
    }, [load]),
  );

  function confirmChange(item: StaffEvent) {
    const takingDown = admin && !officer;
    Alert.alert(takingDown ? t.takeDownTitle : t.cancelEventTitle, `${item.id} · ${item.title}. ${takingDown ? t.takeDownText : t.cancelEventText}`, [
      { text: t.dismiss, style: "cancel" },
      {
        text: t.confirm,
        style: "destructive",
        onPress: () => {
          const action = takingDown ? takeDownEvent(item.uuid) : cancelStaffEvent(item.uuid);
          action.then((message) => {
            if (message) setError(message);
            else load().catch(() => undefined);
          });
        },
      },
    ]);
  }

  if (!profile) return null;
  if (!officer && !admin) {
    return (
      <Screen>
        <Notice>{t.upcomingEventsHint}</Notice>
      </Screen>
    );
  }
  if (loading) return <Loading label={t.events} />;

  function filterLabel(item: EventStatusFilter) {
    if (item === "draft") return t.draft;
    if (item === "published") return t.published;
    if (item === "cancelled") return t.cancelled;
    return t.all;
  }

  function statusName(status: StaffEvent["status"]) {
    if (status === "draft") return t.draft;
    if (status === "published") return t.published;
    return t.cancelled;
  }

  return (
    <Screen>
      <Text style={styles.intro}>{officer ? t.eventsIntro : t.adminEventsText}</Text>
      {officer ? (
        <Button label={t.addEvent} onPress={() => router.push("/events/new")} />
      ) : null}
      {officer ? (
        <View style={styles.filters}>
          {filters.map((item) => {
            const selected = item === filter;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => {
                  setLoading(true);
                  setFilter(item);
                }}
                style={[styles.filter, selected && styles.filterSelected]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filterLabel(item)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {unavailable ? <Notice tone="warn">{t.eventsUnavailable}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {!unavailable && !error && events.length === 0 ? (
        <Notice>{officer ? t.noEvents : t.noPublishedEvents}</Notice>
      ) : null}
      {events.map((item) => {
        const colors = statusColors(item.status);
        return (
          <View key={item.uuid} style={styles.row}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (officer) router.push({ pathname: "/events/[id]", params: { id: item.uuid } });
                else if (item.status === "published") router.push({ pathname: "/e/[id]", params: { id: item.id } });
              }}
            >
              <Text style={styles.title}>
                {item.id} · {item.title}
              </Text>
              <Text style={styles.meta}>
                {formatParkWhen(item.starts_at, item.ends_at, locale)}
                {item.location_name ? ` · ${item.location_name}` : ""}
              </Text>
            </Pressable>
            <Text style={[styles.badge, { backgroundColor: colors.background, color: colors.text }]}>{statusName(item.status)}</Text>
            {item.status !== "cancelled" ? (
              <Button label={officer ? t.cancelEvent : t.takeDown} tone="danger" onPress={() => confirmChange(item)} />
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: "#5e584e", fontSize: 15, lineHeight: 21 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { borderRadius: 999, backgroundColor: "#f7fbf8", paddingHorizontal: 12, paddingVertical: 8 },
  filterSelected: { backgroundColor: "#1e4d38" },
  filterText: { color: "#1c1915", fontWeight: "700" },
  filterTextSelected: { color: "#f7fbf8" },
  row: {
    backgroundColor: "#fffdf8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4dccb",
    padding: 14,
    gap: 8,
  },
  title: { color: "#1c1915", fontSize: 16, fontWeight: "700" },
  meta: { color: "#5e584e", fontSize: 14 },
  badge: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: "700" },
});
