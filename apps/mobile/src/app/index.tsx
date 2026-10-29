import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "@/components/BrandMark";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { useAuth } from "@/lib/auth";
import { listUpcomingEvents, type PublicEvent } from "@/lib/events";
import { usePreferences } from "@/lib/preferences";
import { displayUri } from "@/lib/photos";
import { plantSubtitle, plantTitle, searchPublicPlants, type PublicPlantCard } from "@/lib/publicPlants";
import { colors } from "@/theme";

export default function GuestHome() {
  const { profile } = useAuth();
  const { locale, t } = usePreferences();
  const { width } = useWindowDimensions();
  const tileSize = Math.floor((width - 16 * 2 - 12) / 2);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [plants, setPlants] = useState<PublicPlantCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventsNote, setEventsNote] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const result = await listUpcomingEvents();
    setEvents(result.events);
    setEventsNote(result.unavailable ? t.eventsUnavailable : result.error);
  }, [t.eventsUnavailable]);

  const load = useCallback(async (nextQuery: string) => {
    setError(null);
    try {
      setPlants(await searchPublicPlants(nextQuery));
    } catch (cause) {
      setPlants([]);
      setError(cause instanceof Error ? cause.message : "Could not load plants.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    searchPublicPlants("")
      .then((next) => {
        if (cancelled) return;
        setPlants(next);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setPlants([]);
        setError(cause instanceof Error ? cause.message : "Could not load plants.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listUpcomingEvents()
      .then((result) => {
        if (cancelled) return;
        setEvents(result.events);
        setEventsNote(result.unavailable ? t.eventsUnavailable : result.error);
      })
      .catch(() => {
        if (!cancelled) setEventsNote(t.eventsUnavailable);
      });
    return () => {
      cancelled = true;
    };
  }, [t.eventsUnavailable]);

  function search() {
    const next = draft.trim();
    setQuery(next);
    setRefreshing(true);
    Promise.all([load(next), loadEvents()]).finally(() => setRefreshing(false));
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <BrandMark />
          <Text style={styles.brandText}>Plant Records</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.login, pressed && styles.loginPressed]}
          onPress={() => router.push(profile ? "/field" : "/login")}
        >
          <Text style={styles.loginText}>{profile ? "Field book" : "Log in"}</Text>
        </Pressable>
      </View>
      <FlatList
        key="plant-grid"
        data={plants}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        keyExtractor={(item) => item.qr_code}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.forest}
            onRefresh={() => {
              setRefreshing(true);
              Promise.all([load(query), loadEvents()]).finally(() => setRefreshing(false));
            }}
          />
        }
        ListHeaderComponent={
          <>
          <View style={styles.hero}>
            <Text style={styles.kicker}>Public plant knowledge</Text>
            <Text style={styles.title}>Find a plant</Text>
            <Text style={styles.hint}>
              Search plants by scientific, common, or local name. Exact GPS locations are not shown here.
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={search}
                placeholder="Search plants"
                placeholderTextColor="#8a9188"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
                onPress={search}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.scanButton, pressed && styles.scanButtonPressed]}
              onPress={() => router.push("/tag")}
            >
              <Text style={styles.scanButtonText}>Scan QR</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
          <View style={styles.events}>
            <UpcomingEvents
              title={t.upcomingEvents}
              hint={t.upcomingEventsHint}
              empty={t.noUpcomingEvents}
              events={events}
              note={eventsNote}
              locale={locale}
            />
          </View>
          <View style={styles.interest}>
            <Text style={styles.interestTitle}>{t.guessInterest}</Text>
            <Text style={styles.interestHint}>{t.guessInterestHint}</Text>
          </View>
          </>
        }
        ListEmptyComponent={
          error ? undefined : <Text style={styles.empty}>{query ? "No plants match that search." : "No published plants yet."}</Text>
        }
        renderItem={({ item }) => <PlantTile plant={item} size={tileSize} />}
      />
    </SafeAreaView>
  );
}

function PlantTile({ plant, size }: { plant: PublicPlantCard; size: number }) {
  const [photo, setPhoto] = useState<{ path: string; uri: string | null } | null>(null);

  useEffect(() => {
    if (!plant.image_path) return;
    let cancelled = false;
    const path = plant.image_path;
    displayUri(path)
      .then((uri) => {
        if (!cancelled) setPhoto({ path, uri });
      })
      .catch(() => {
        if (!cancelled) setPhoto({ path, uri: null });
      });
    return () => {
      cancelled = true;
    };
  }, [plant.image_path]);

  const uri = plant.image_path && photo?.path === plant.image_path ? photo.uri : null;
  const subtitle = plantSubtitle(plant);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.tile, { width: size, height: size }, pressed && styles.tilePressed]}
      onPress={() => router.push({ pathname: "/p/[code]", params: { code: plant.qr_code } })}
    >
      {({ pressed }) => (
        <>
          {uri ? <Image source={{ uri }} style={styles.tilePhoto} contentFit="cover" /> : null}
          {uri ? <View style={styles.tileScrim} /> : null}
          {pressed ? <View style={styles.tilePress} /> : null}
          <Text style={[styles.cardStatus, uri ? styles.onPhotoMuted : null]} numberOfLines={1}>
            {plant.conservation_status || "Plant"}
          </Text>
          <Text style={[styles.cardTitle, uri ? styles.onPhoto : null]} numberOfLines={3}>
            {plantTitle(plant)}
          </Text>
          <Text style={[styles.cardMeta, uri ? styles.onPhotoMuted : null]} numberOfLines={2}>
            {subtitle || "No common name"}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#e7f0e4" },
  header: {
    backgroundColor: "#fffcf8",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20, 53, 40, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  brandText: { color: colors.forest, fontSize: 18, fontWeight: "700" },
  login: {
    backgroundColor: colors.forest,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loginPressed: { backgroundColor: colors.forestDark },
  loginText: { color: "#fffdf8", fontWeight: "700" },
  list: { padding: 16, paddingBottom: 32, gap: 12 },
  gridRow: { gap: 12, alignItems: "flex-start" },
  events: { marginTop: 16 },
  interest: { marginTop: 22, gap: 4, paddingHorizontal: 2 },
  interestTitle: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  interestHint: { color: "#5c6560", fontSize: 14, lineHeight: 20 },
  hero: {
    backgroundColor: "#fffcf8",
    borderRadius: 20,
    padding: 20,
    gap: 8,
    marginBottom: 4,
  },
  kicker: { color: colors.forest, fontSize: 14, fontWeight: "600" },
  title: { color: colors.ink, fontSize: 32, fontWeight: "700" },
  hint: { color: "#5c6560", fontSize: 14, lineHeight: 20 },
  searchRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#d7e0d6",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: colors.ink,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: colors.forest,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: { color: "#fffdf8", fontWeight: "700" },
  searchButtonPressed: { backgroundColor: colors.forestDark },
  scanButton: {
    marginTop: 4,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonText: { color: colors.forest, fontWeight: "700", fontSize: 16 },
  scanButtonPressed: { backgroundColor: colors.okBg },
  error: { color: colors.danger, fontSize: 14 },
  empty: {
    backgroundColor: "#fffcf8",
    borderRadius: 20,
    padding: 20,
    color: "#6b726c",
  },
  tile: {
    backgroundColor: "#143528",
    borderRadius: 28,
    padding: 16,
    overflow: "hidden",
    gap: 6,
  },
  tilePhoto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  tileScrim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(14, 36, 28, 0.45)" },
  tilePressed: { backgroundColor: "#1e4d38" },
  tilePress: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(247, 251, 248, 0.18)" },
  cardStatus: { color: "#d7e6da", fontSize: 12, fontWeight: "600" },
  cardTitle: { color: "#f7fbf8", fontSize: 22, fontWeight: "700", lineHeight: 26 },
  cardMeta: { color: "rgba(247, 251, 248, 0.82)", fontSize: 13, lineHeight: 18 },
  onPhoto: { color: "#f7fbf8" },
  onPhotoMuted: { color: "rgba(247, 251, 248, 0.86)" },
});
