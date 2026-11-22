import * as Location from "expo-location";
import { usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { listOpenEmergencies, resolveEmergency, sendEmergency, watchEmergencies } from "@/lib/emergency";
import { usePreferences } from "@/lib/preferences";

export function EmergencyButton() {
  const { profile, online } = useAuth();
  const { t } = usePreferences();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [sending, setSending] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const onScan = pathname === "/scan" || pathname.startsWith("/scan/");

  const refresh = useCallback(async () => {
    if (!profile) return;
    const result = await listOpenEmergencies();
    setOpenId(result.alerts.find((alert) => alert.botanist_id === profile.uuid)?.uuid ?? null);
  }, [profile]);

  useEffect(() => {
    if (!profile || profile.role !== "botanist") return;
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    const stop = watchEmergencies(() => void refresh());
    return () => {
      clearInterval(timer);
      stop();
    };
  }, [profile, refresh]);

  if (!profile || profile.role !== "botanist" || onScan) return null;

  async function readLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return { latitude: null, longitude: null };
      if (Platform.OS === "android") await Location.enableNetworkProviderAsync().catch(() => undefined);
      const last = await Location.getLastKnownPositionAsync();
      const current = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);
      const position = current ?? last;
      if (!position) return { latitude: null, longitude: null };
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch {
      return { latitude: null, longitude: null };
    }
  }

  async function send() {
    if (!profile) return;
    setSending(true);
    const position = await readLocation();
    const result = await sendEmergency(profile, position.latitude, position.longitude);
    setSending(false);
    if (result.error === "setup") Alert.alert(t.emergency, t.emergencySetup);
    else if (result.error) Alert.alert(t.emergency, t.emergencyFailed);
    else {
      Alert.alert(t.emergency, t.emergencySent);
      await refresh();
    }
  }

  function markSafe() {
    if (!openId) return;
    const id = openId;
    setSending(true);
    void resolveEmergency(id).then((result) => {
      setSending(false);
      if (result.error) Alert.alert(t.emergency, t.emergencyFailed);
      else setOpenId(null);
    });
  }

  function onPress() {
    if (!online) {
      Alert.alert(t.emergency, t.emergencyOffline);
      return;
    }
    const actions: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [
      { text: t.dismiss, style: "cancel" },
    ];
    if (openId) actions.push({ text: t.emergencySafe, onPress: markSafe });
    actions.push({
      text: openId ? t.emergencyUpdate : t.emergencySend,
      style: "destructive",
      onPress: () => void send(),
    });
    Alert.alert(t.emergency, openId ? t.emergencyOpen : t.emergencyConfirm, actions);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.emergency}
      disabled={sending}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { bottom: insets.bottom + 72 },
        pressed && styles.pressed,
        sending && styles.disabled,
      ]}
    >
      <Text style={styles.label}>{sending ? t.emergencySending : t.emergency}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    zIndex: 30,
    borderRadius: 999,
    backgroundColor: "#8f2d2d",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  label: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
