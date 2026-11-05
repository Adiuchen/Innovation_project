import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loading, Notice } from "@/components/ui";
import { upsertCachedRecord } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { firstParam } from "@/lib/plant";
import { lookupTag, type TagHit } from "@/lib/sync";
import { colors } from "@/theme";

export default function StaffTagRouterScreen() {
  const { code: rawCode } = useLocalSearchParams<{ code: string }>();
  const code = decodeURIComponent(firstParam(rawCode));
  const { online } = useAuth();
  const [hit, setHit] = useState<TagHit | null>(null);
  const [routed, setRouted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    lookupTag(code, online)
      .then(async (result) => {
        if (cancelled) return;

        if (result.kind === "draft") {
          setRouted(true);
          router.replace(`/records/draft/${result.draft.local_id}`);
          return;
        }

        if (result.kind === "public") {
          setRouted(true);
          router.replace({
            pathname: "/p/[code]",
            params: { code: result.plant.qr_code || code },
          });
          return;
        }

        if (result.kind === "record") {
          const status = result.record.status;
          if (status === "approved") {
            setRouted(true);
            router.replace({
              pathname: "/p/[code]",
              params: { code: result.record.qr_code || code },
            });
            return;
          }

          // submitted / needs_revision / rejected / draft — open the field record.
          // Edit UI stays gated on the record screen (draft | needs_revision | rejected only).
          await upsertCachedRecord(result.record).catch(() => undefined);
          setRouted(true);
          router.replace(`/records/${result.record.uuid}`);
          return;
        }

        setHit(result);
      })
      .catch(() => {
        if (!cancelled) setHit({ kind: "missing", offline: !online });
      });
    return () => {
      cancelled = true;
    };
  }, [code, online]);

  if (routed || !hit) return <Loading label="Looking up this tag…" />;

  if (hit.kind === "missing") {
    return (
      <SafeAreaView style={styles.shell} edges={["top", "bottom"]}>
        <Header title="Tagged plant" />
        <View style={styles.content}>
          <Notice tone="warn">
            {hit.offline
              ? "This tag is not saved on the phone. Download records or plant details while you have internet, then scan again."
              : `No plant record was found for ${code}.`}
          </Notice>
        </View>
      </SafeAreaView>
    );
  }

  return <Loading label="Opening this tag…" />;
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/scan");
        }}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.paper },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(28, 25, 21, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { fontSize: 32, color: colors.ink, lineHeight: 32, marginTop: -2 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 24, fontWeight: "700", color: colors.ink },
  spacer: { width: 52 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 14 },
});
