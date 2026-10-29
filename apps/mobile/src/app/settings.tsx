import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { copyPhotoIntoApp } from "@/lib/photos";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import type { Locale } from "@/lib/copy";
import type { ThemeChoice } from "@/lib/preferences";

const languages: { key: Locale; label: "chinese" | "english" | "malay" }[] = [
  { key: "zh", label: "chinese" },
  { key: "en", label: "english" },
  { key: "ms", label: "malay" },
];

const themes: { key: ThemeChoice; label: "day" | "night" | "auto" }[] = [
  { key: "light", label: "day" },
  { key: "dark", label: "night" },
  { key: "auto", label: "auto" },
];

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { avatarUri, locale, theme, palette, t, setAvatarUri, setLocale, setTheme } = usePreferences();
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const initial = profile?.name.trim().charAt(0).toUpperCase() || "?";

  async function changeAvatar() {
    setPhotoNote(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoNote(t.photoLibrary);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri || !profile) return;
    try {
      setAvatarUri(await copyPhotoIntoApp(`avatar-${profile.uuid}`, uri));
    } catch {
      setAvatarUri(uri);
    }
  }

  async function logout() {
    setAvatarUri(null);
    await signOut();
    router.replace("/");
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/field");
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.field }]} edges={["top", "bottom"]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" onPress={close} hitSlop={8}>
          <Text style={[styles.back, { color: palette.ink }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: palette.ink }]}>{t.settings}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarBlock}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.face} contentFit="cover" />
          ) : (
            <View style={[styles.face, styles.fallback, { backgroundColor: palette.forest }]}>
              <Text style={styles.letter}>{initial}</Text>
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={changeAvatar}>
            <Text style={[styles.link, { color: palette.leaf }]}>{t.changeAvatar}</Text>
          </Pressable>
          {photoNote ? <Text style={[styles.hint, { color: palette.muted }]}>{photoNote}</Text> : null}
        </View>

        <Text style={[styles.heading, { color: palette.muted }]}>{t.language}</Text>
        <View style={[styles.group, { backgroundColor: palette.sheet }]}>
          {languages.map((item) => (
            <Pressable key={item.key} accessibilityRole="button" style={styles.row} onPress={() => setLocale(item.key)}>
              <Text style={[styles.rowLabel, { color: palette.ink }]}>{t[item.label]}</Text>
              <Text style={{ color: palette.leaf }}>{locale === item.key ? "●" : "○"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.heading, { color: palette.muted }]}>{t.theme}</Text>
        <View style={[styles.group, { backgroundColor: palette.sheet }]}>
          {themes.map((item) => (
            <Pressable key={item.key} accessibilityRole="button" style={styles.row} onPress={() => setTheme(item.key)}>
              <Text style={[styles.rowLabel, { color: palette.ink }]}>{t[item.label]}</Text>
              <Text style={{ color: palette.leaf }}>{theme === item.key ? "●" : "○"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.hint, { color: palette.muted }]}>{t.logoutHint}</Text>
        <Pressable accessibilityRole="button" style={[styles.logout, { backgroundColor: palette.dangerBg }]} onPress={logout}>
          <Text style={[styles.logoutText, { color: palette.danger }]}>{t.logout}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: "row", alignItems: "center", gap: 12 },
  back: { fontSize: 32, lineHeight: 34, fontWeight: "400" },
  title: { fontSize: 17, fontWeight: "700" },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  avatarBlock: { alignItems: "center", gap: 10, paddingVertical: 8 },
  face: { width: 84, height: 84, borderRadius: 42 },
  fallback: { alignItems: "center", justifyContent: "center" },
  letter: { color: "#f4f7f2", fontSize: 32, fontWeight: "700" },
  link: { fontSize: 16, fontWeight: "700" },
  heading: { fontSize: 13, fontWeight: "700", marginTop: 8 },
  group: { borderRadius: 16, overflow: "hidden" },
  row: { minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 16 },
  hint: { fontSize: 13, marginTop: 12 },
  logout: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  logoutText: { fontSize: 16, fontWeight: "700" },
});
