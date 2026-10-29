import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { usePreferences } from "@/lib/preferences";

export function AvatarMenu({ name, staffId }: { name: string; staffId: string }) {
  const router = useRouter();
  const { avatarUri, palette, t } = usePreferences();
  const [open, setOpen] = useState(false);
  const openSettingsAfterClose = useRef(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  function openSettings() {
    if (Platform.OS === "ios") {
      openSettingsAfterClose.current = true;
      setOpen(false);
      return;
    }
    setOpen(false);
    router.push("/settings");
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={t.settings} onPress={() => setOpen(true)}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.face} contentFit="cover" />
        ) : (
          <View style={[styles.face, styles.fallback, { backgroundColor: palette.forest }]}>
            <Text style={styles.letter}>{initial}</Text>
          </View>
        )}
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        onDismiss={() => {
          if (!openSettingsAfterClose.current) return;
          openSettingsAfterClose.current = false;
          router.push("/settings");
        }}
      >
        <View style={styles.overlay}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.name, { color: palette.ink }]}>{name}</Text>
            <Text style={[styles.id, { color: palette.muted }]}>{staffId}</Text>
            <Pressable accessibilityRole="button" style={[styles.action, { backgroundColor: palette.forest }]} onPress={openSettings}>
              <Text style={styles.actionText}>{t.settings}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  face: { width: 52, height: 52, borderRadius: 26 },
  fallback: { alignItems: "center", justifyContent: "center" },
  letter: { color: "#f4f7f2", fontSize: 22, fontWeight: "700" },
  overlay: { flex: 1 },
  card: {
    position: "absolute",
    top: 72,
    right: 16,
    width: 220,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  name: { fontSize: 17, fontWeight: "700" },
  id: { fontSize: 13, marginBottom: 8 },
  action: { minHeight: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionText: { color: "#f7fbf8", fontWeight: "700" },
});
