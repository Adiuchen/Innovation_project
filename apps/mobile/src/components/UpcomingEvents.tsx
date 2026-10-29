import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { Image } from "expo-image";
import { ScrollView } from "react-native-gesture-handler";
import type { Locale } from "@/lib/copy";
import type { PublicEvent } from "@/lib/events";
import { formatParkWhen } from "@/lib/park-time";
import { displayUri } from "@/lib/photos";
import { usePreferences } from "@/lib/preferences";

const SLIDE_MS = 4000;

export function UpcomingEvents({
  title,
  hint,
  empty,
  events,
  note,
  locale,
  manageLabel,
  onManage,
}: {
  title: string;
  hint: string;
  empty: string;
  events: PublicEvent[];
  note: string | null;
  locale: Locale;
  manageLabel?: string;
  onManage?: () => void;
}) {
  const { t } = usePreferences();
  const scroller = useRef<ScrollViewInstance>(null);
  const pageWidthRef = useRef(0);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const safeIndex = events.length > 0 ? index % events.length : 0;
  const slide = events[safeIndex];

  useEffect(() => {
    indexRef.current = safeIndex;
  }, [safeIndex]);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (pageWidth <= 0) return;
    scroller.current?.scrollTo({ x: indexRef.current * pageWidth, animated: false });
  }, [pageWidth]);

  useEffect(() => {
    if (events.length < 2 || paused || reduceMotion || pageWidth <= 0) return;
    const timer = setTimeout(() => {
      const next = (safeIndex + 1) % events.length;
      scroller.current?.scrollTo({ x: next * pageWidth, animated: true });
      setIndex(next);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [events.length, pageWidth, paused, reduceMotion, safeIndex]);

  function rememberWidth(width: number) {
    const next = Math.round(width);
    if (next <= 0 || next === pageWidthRef.current) return;
    pageWidthRef.current = next;
    setPageWidth(next);
  }

  function settle(offsetX: number) {
    const width = pageWidthRef.current;
    if (width <= 0 || events.length === 0) return;
    const page = Math.max(0, Math.min(events.length - 1, Math.round(offsetX / width)));
    setIndex(page);
    setPaused(false);
  }

  function goTo(dot: number) {
    setIndex(dot);
    const width = pageWidthRef.current;
    if (width > 0) scroller.current?.scrollTo({ x: dot * width, animated: true });
  }

  return (
    <View style={styles.block}>
      {onManage && manageLabel ? (
        <Pressable accessibilityRole="button" onPress={onManage} style={styles.manageHit}>
          <Text style={styles.manage}>{manageLabel}</Text>
        </Pressable>
      ) : null}
      <View style={styles.banner} onLayout={(event) => rememberWidth(event.nativeEvent.layout.width)}>
        {note || !slide ? (
          <View style={styles.pageCopy}>
            <Text style={styles.label}>{title}</Text>
            <Text style={styles.quiet}>{note || empty}</Text>
            {!note ? <Text style={styles.quiet}>{hint}</Text> : null}
          </View>
        ) : pageWidth > 0 ? (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            directionalLockEnabled
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={pageWidth}
            snapToAlignment="start"
            style={{ width: pageWidth }}
            onScrollBeginDrag={() => setPaused(true)}
            onScrollEndDrag={(event) => {
              const velocity = event.nativeEvent.velocity?.x ?? 0;
              if (Math.abs(velocity) < 0.2) settle(event.nativeEvent.contentOffset.x);
            }}
            onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.x)}
          >
            {events.map((event) => (
              <View key={event.id} style={[styles.frame, { width: pageWidth }]}>
                <EventPage event={event} title={title} locale={locale} viewLabel={t.viewEvent} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.page} />
        )}
        {events.length > 1 ? (
          <View style={styles.dots} pointerEvents="box-none">
            {events.map((event, dot) => {
              const selected = dot === safeIndex;
              return (
                <Pressable
                  key={event.id}
                  accessibilityRole="button"
                  accessibilityLabel={event.title}
                  onPress={() => goTo(dot)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.dot, selected && styles.dotSelected, pressed && styles.dotPressed]}
                />
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function EventPage({
  event,
  title,
  locale,
  viewLabel,
}: {
  event: PublicEvent;
  title: string;
  locale: Locale;
  viewLabel: string;
}) {
  const [photo, setPhoto] = useState<{ path: string; uri: string | null } | null>(null);

  useEffect(() => {
    if (!event.image_path) return;
    let cancelled = false;
    const path = event.image_path;
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
  }, [event.image_path]);

  const uri = event.image_path && photo?.path === event.image_path ? photo.uri : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/e/[id]", params: { id: event.id } })}
      style={({ pressed }) => [styles.page, pressed && styles.pagePressed]}
    >
      {({ pressed }) => (
        <>
          {uri ? <Image source={{ uri }} style={styles.photo} contentFit="cover" /> : null}
          {uri ? <View style={styles.scrim} /> : null}
          {pressed ? <View style={styles.pageWash} /> : null}
          <View style={styles.slide}>
            <View style={styles.copy}>
              <Text style={styles.label}>{title}</Text>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.when} numberOfLines={2}>
                {formatParkWhen(event.starts_at, event.ends_at, locale)}
                {event.location_name ? ` · ${event.location_name}` : ""}
              </Text>
              {event.description ? (
                <Text style={styles.quiet} numberOfLines={2}>
                  {event.description}
                </Text>
              ) : null}
            </View>
            <View style={[styles.view, pressed && styles.viewPressed]}>
              <Text style={[styles.viewText, pressed && styles.viewTextPressed]}>{viewLabel}</Text>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  manageHit: { alignSelf: "flex-end" },
  manage: { color: "#1e4d38", fontSize: 15, fontWeight: "700" },
  banner: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#143528",
    minHeight: 156,
  },
  frame: { overflow: "hidden" },
  page: { minHeight: 156, padding: 18, paddingBottom: 36, justifyContent: "center" },
  pagePressed: { backgroundColor: "#1e4d38" },
  pageWash: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(247, 251, 248, 0.12)" },
  pageCopy: { minHeight: 156, padding: 18, gap: 4, justifyContent: "center" },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  scrim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(14, 36, 28, 0.72)" },
  slide: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  label: { color: "#c9e6d4", fontSize: 13, fontWeight: "700" },
  eventTitle: { color: "#f7fbf8", fontSize: 26, fontWeight: "700" },
  when: { color: "rgba(247, 251, 248, 0.86)", fontSize: 14 },
  quiet: { color: "rgba(247, 251, 248, 0.72)", fontSize: 14, lineHeight: 20 },
  view: { flexShrink: 0, backgroundColor: "#f7fbf8", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  viewPressed: { backgroundColor: "#d5e6c8" },
  viewText: { color: "#1e4d38", fontSize: 14, fontWeight: "700" },
  viewTextPressed: { color: "#143528" },
  dots: { position: "absolute", left: 18, bottom: 14, zIndex: 2, flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(247, 251, 248, 0.4)" },
  dotSelected: { backgroundColor: "#f7fbf8" },
  dotPressed: { backgroundColor: "#d5e6c8" },
});
