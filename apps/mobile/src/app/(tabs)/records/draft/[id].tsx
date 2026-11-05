import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { PrintQrButton } from "@/components/PrintQrButton";
import { Notice, Screen } from "@/components/ui";
import { RecordForm } from "@/components/RecordForm";
import { getDraft, saveDraft } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { firstParam, plantQrValue, qrCodeForRecord } from "@/lib/plant";
import { siteUrl } from "@/lib/supabase";
import { colors } from "@/theme";
import type { Draft, FieldInput } from "@/types";

export default function DraftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const localId = firstParam(id);
  const { profile, online, syncNow } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getDraft(localId).then((row) => {
      setDraft(row);
      setMissing(!row);
    });
  }, [localId]);

  if (!profile) return null;
  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">This saved record is no longer on the phone.</Notice>
      </Screen>
    );
  }
  if (!draft) return null;

  const qrCode = draft.qr_code;
  const qrValue = qrCode ? plantQrValue(qrCode, siteUrl) : null;

  return (
    <Screen>
      {draft.sync_error && <Notice tone="danger">{draft.sync_error}</Notice>}
      {qrCode ? (
        <Notice tone="ok">
          {draft.status === "submitted"
            ? "QR ready. Print the tag now; it stays the same after upload."
            : "This record already has a QR tag."}
        </Notice>
      ) : null}
      <RecordForm
        localId={draft.local_id}
        mode="create"
        initial={draft}
        submitLabel="Save record"
        onSubmit={async (input: FieldInput) => {
          const nextQr =
            draft.qr_code || (input.status === "submitted" ? qrCodeForRecord(draft.local_id) : null);
          try {
            await saveDraft({
              ...draft,
              ...input,
              photo_remote_url: input.photo_uri === draft.photo_uri ? draft.photo_remote_url : null,
              qr_code: nextQr,
              sync_error: null,
              saved_at: new Date().toISOString(),
            });
            setDraft({
              ...draft,
              ...input,
              photo_remote_url: input.photo_uri === draft.photo_uri ? draft.photo_remote_url : null,
              qr_code: nextQr,
              sync_error: null,
              saved_at: new Date().toISOString(),
            });
          } catch (error) {
            return error instanceof Error ? error.message : "Could not save this record on the phone.";
          }
          if (online) await syncNow();
          if (nextQr && input.status === "submitted") return null;
          router.replace("/records");
          return null;
        }}
      />
      {qrValue && qrCode ? (
        <View style={styles.qr}>
          <QRCode value={qrValue} size={180} />
          <Text style={styles.meta}>{qrCode}</Text>
          <Text style={styles.meta}>{qrValue}</Text>
          <PrintQrButton qrCode={qrCode} label={draft.plant_name || qrCode} />
          {!siteUrl ? (
            <Notice tone="warn">
              Set EXPO_PUBLIC_SITE_URL to the website address so a printed tag opens the public plant page. This
              code can already be scanned inside the app.
            </Notice>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { color: colors.muted, fontSize: 14 },
  qr: { alignItems: "flex-start", gap: 8, backgroundColor: "#fff", padding: 16, borderRadius: 24 },
});
