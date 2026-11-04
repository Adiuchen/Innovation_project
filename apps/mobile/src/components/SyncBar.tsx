import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";

type Tone = "ok" | "warn" | "muted" | "busy";

const words = {
  en: {
    syncing: "Syncing…",
    allSynced: "All synced",
    offline: "Offline",
    offlineSaved: "Offline · working from the copy on this phone",
    waiting: (n: number) => `${n} waiting to upload`,
    tapToSync: "Tap to sync",
  },
  ms: {
    syncing: "Menyegerak…",
    allSynced: "Semua telah disegerakkan",
    offline: "Luar talian",
    offlineSaved: "Luar talian · menggunakan salinan dalam telefon",
    waiting: (n: number) => `${n} menunggu dimuat naik`,
    tapToSync: "Ketik untuk segerak",
  },
  zh: {
    syncing: "正在同步…",
    allSynced: "全部已同步",
    offline: "离线",
    offlineSaved: "离线 · 使用手机上的副本",
    waiting: (n: number) => `${n} 条待上传`,
    tapToSync: "点按同步",
  },
};

/**
 * Always-visible connection and upload status, shown at the top of every tab.
 * Botanists can tap it to upload waiting records.
 */
export function SyncBar() {
  const { online, pending, syncing, syncNow, profile } = useAuth();
  const { locale } = usePreferences();
  const insets = useSafeAreaInsets();
  const w = words[locale as keyof typeof words] ?? words.en;

  let tone: Tone;
  let label: string;
  if (syncing) {
    tone = "busy";
    label = w.syncing;
  } else if (!online) {
    tone = pending > 0 ? "warn" : "muted";
    label = pending > 0 ? `${w.offline} · ${w.waiting(pending)}` : w.offlineSaved;
  } else if (pending > 0) {
    tone = "warn";
    label = `${w.waiting(pending)} · ${w.tapToSync}`;
  } else {
    tone = "ok";
    label = w.allSynced;
  }

  const canTap = online && !syncing && profile != null;
  const palette = tones[tone];

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, backgroundColor: palette.bg }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !canTap, busy: syncing }}
        disabled={!canTap}
        onPress={() => syncNow()}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={palette.text} />
        ) : (
          <View style={[styles.dot, { backgroundColor: palette.dot }]} />
        )}
        <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

// Colours chosen for at least 4.5:1 contrast between text and background.
const tones: Record<Tone, { bg: string; text: string; dot: string }> = {
  ok: { bg: "#e5f2ea", text: "#1e4d38", dot: "#2f8a5b" },
  warn: { bg: "#fbefd5", text: "#6b4508", dot: "#d08a12" },
  muted: { bg: "#ece8df", text: "#4a453c", dot: "#8a8378" },
  busy: { bg: "#e3edf6", text: "#1e4a6d", dot: "#1e4a6d" },
};

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  bar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.7 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { fontSize: 14, fontWeight: "700" },
});
