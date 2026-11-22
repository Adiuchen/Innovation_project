import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import {
  emergencyMapUrl,
  emergencyPlace,
  listOpenEmergencies,
  resolveEmergency,
  watchEmergencies,
  type EmergencyAlert,
} from "@/lib/emergency";
import { usePreferences } from "@/lib/preferences";

export function EmergencyWatch() {
  const { profile } = useAuth();
  const { locale, palette, t } = usePreferences();
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const known = useRef(new Set<string>());
  const watching = profile?.role === "botanist" || profile?.role === "conservation_officer";

  const refresh = useCallback(async () => {
    if (!profile || (profile.role !== "botanist" && profile.role !== "conservation_officer")) return;
    const result = await listOpenEmergencies();
    if (result.error && result.alerts.length === 0) return;
    setAlerts(result.alerts.filter((alert) => alert.botanist_id !== profile.uuid));
  }, [profile]);

  useEffect(() => {
    if (!watching) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    const stop = watchEmergencies(() => void refresh());
    return () => {
      clearInterval(timer);
      stop();
    };
  }, [refresh, watching]);

  useEffect(() => {
    const fresh = alerts.some((alert) => !known.current.has(alert.uuid));
    for (const alert of alerts) known.current.add(alert.uuid);
    if (alerts.length === 0) setOpen(false);
    else if (fresh) setOpen(true);
  }, [alerts]);

  if (!watching || alerts.length === 0) return null;

  const label = alerts.length > 1 ? `${alerts.length} ${t.emergency}` : t.emergency;

  return (
    <>
      {!open && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => setOpen(true)}
          style={[styles.chip, { top: insets.top + 8 }]}
        >
          <Text style={styles.chipText}>{label}</Text>
        </Pressable>
      )}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel={t.emergencyClose} style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: palette.danger }]}>{t.emergency}</Text>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={[styles.close, { color: palette.ink }]}>{t.emergencyClose}</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {alerts.map((alert) => {
                const place = emergencyPlace(alert.latitude, alert.longitude);
                const when = new Date(alert.created_at).toLocaleString(locale === "zh" ? "zh-CN" : locale === "ms" ? "ms-MY" : "en-MY", {
                  hour: "numeric",
                  minute: "2-digit",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <View key={alert.uuid} style={styles.item}>
                    <Text style={[styles.message, { color: palette.ink }]}>
                      {t.emergencyIncoming.replace("{name}", alert.botanist_name).replace("{id}", alert.staff_id)}
                    </Text>
                    <Text style={[styles.meta, { color: palette.muted }]}>
                      {when} · {place ?? t.emergencyNoLocation}
                    </Text>
                    <View style={styles.actions}>
                      {place && alert.latitude != null && alert.longitude != null && (
                        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(emergencyMapUrl(alert.latitude!, alert.longitude!))}>
                          <Text style={[styles.action, { color: palette.forest }]}>{t.emergencyMap}</Text>
                        </Pressable>
                      )}
                      {profile?.role === "conservation_officer" && (
                        <Pressable
                          accessibilityRole="button"
                          disabled={busy === alert.uuid}
                          onPress={() => {
                            setBusy(alert.uuid);
                            void resolveEmergency(alert.uuid).then(() => {
                              setBusy(null);
                              void refresh();
                            });
                          }}
                        >
                          <Text style={[styles.action, { color: palette.forest }]}>{t.emergencyResolve}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: "absolute",
    left: 12,
    zIndex: 40,
    borderRadius: 999,
    backgroundColor: "#8f2d2d",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 16, 12, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "70%",
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  close: { fontSize: 15, fontWeight: "700" },
  list: { flexGrow: 0 },
  listContent: { gap: 16 },
  item: { gap: 6 },
  message: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  meta: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 16 },
  action: { fontSize: 15, fontWeight: "700" },
});
