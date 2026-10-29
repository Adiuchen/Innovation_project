import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Badge, Button, Fact, Notice, Screen } from "@/components/ui";
import { RecordForm } from "@/components/RecordForm";
import { getRecord } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { choiceLabel, firstParam, flowerChoices, formatWhen, healthChoices, leafChoices, lifeStageChoices, plantQrValue, recordName } from "@/lib/plant";
import { generateRecordQr, resubmitRecord } from "@/lib/remote";
import { refreshReferenceData } from "@/lib/sync";
import { siteUrl } from "@/lib/supabase";
import { colors } from "@/theme";
import type { CachedRecord, FieldInput } from "@/types";

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = firstParam(id);
  const { profile, online, syncNow } = useAuth();
  const [record, setRecord] = useState<CachedRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    let row = await getRecord(recordId);
    if (!row && online && profile?.role === "botanist") {
      await refreshReferenceData(profile);
      row = await getRecord(recordId);
    }
    setRecord(row);
    setMissing(!row);
  }, [online, profile, recordId]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => setMissing(true));
    }, [load]),
  );

  if (!profile) return null;
  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">This record is not on this phone. Connect and refresh your records.</Notice>
      </Screen>
    );
  }
  if (!record) return null;

  const editable = record.status === "draft" || record.status === "needs_revision";
  const qrValue = record.qr_code ? plantQrValue(record.qr_code, siteUrl) : null;

  return (
    <Screen>
      <Text style={styles.name}>{recordName(record.plant_name, record.species_name)}</Text>
      {record.plant_name && record.species_name ? <Text style={styles.species}>{record.species_name}</Text> : null}
      {record.common_name ? <Text style={styles.common}>{record.common_name}</Text> : null}
      {editable ? (
        <>
          <Badge status={record.status} />
          {record.code ? <Fact label="Record" value={record.code} /> : null}
          {record.recorded_at ? <Fact label="Recorded" value={formatWhen(record.recorded_at)} /> : null}
        </>
      ) : null}
      {record.review_note && <Notice tone="warn">Officer note: {record.review_note}</Notice>}
      {message && <Notice tone="danger">{message}</Notice>}

      {editable && profile.role === "botanist" ? (
        <RecordForm
          localId={record.uuid}
          mode="revise"
          submitLabel="Submit again"
          initial={{
            species_id: record.species_id,
            species_label: record.species_name ?? "",
            plant_name: record.plant_name ?? "",
            life_stage: record.life_stage ?? "",
            height_m: record.height_m?.toString() ?? "",
            trunk_diameter_cm: record.trunk_diameter_cm?.toString() ?? "",
            latitude: record.latitude?.toString() ?? "",
            longitude: record.longitude?.toString() ?? "",
            location_name: record.location_name ?? "",
            leaf_traits: record.leaf_traits ?? "",
            flower_fruit_traits: record.flower_fruit_traits ?? "",
            health_status: record.health_status ?? "",
            other_traits: record.other_traits ?? "",
            photo_uri: record.photos[0]?.storage_path ?? null,
            photo_caption: record.photos[0]?.caption ?? "",
            status: "submitted",
          }}
          onSubmit={async (input: FieldInput) => {
            if (!online) return "Connect to the network before updating a record that is already in the central database.";
            const originalPhoto = record.photos[0]?.storage_path ?? null;
            const error = await resubmitRecord(profile.uuid, record.uuid, {
              ...input,
              photo_uri: input.photo_uri === originalPhoto ? null : input.photo_uri,
            });
            if (error) return error;
            await syncNow();
            await load();
            setMessage(null);
            return null;
          }}
        />
      ) : (
        <SubmittedRecord record={record} />
      )}

      {record.status === "approved" && !record.qr_code && profile.role === "botanist" && (
        <Button
          label={working ? "Generating…" : "Generate QR code"}
          disabled={working || !online}
          onPress={async () => {
            if (!online) {
              setMessage("Connect to the network before generating a QR code.");
              return;
            }
            setWorking(true);
            const result = await generateRecordQr(record.uuid);
            setWorking(false);
            if (result.error || !result.code) {
              setMessage(result.error ?? "Could not generate a QR code.");
              return;
            }
            setRecord({ ...record, qr_code: result.code });
            await syncNow();
            await load();
          }}
        />
      )}
      {record.status === "approved" && !record.qr_code && !online && (
        <Notice tone="warn">Connect to generate the QR tag after this record is approved.</Notice>
      )}
      {record.status !== "approved" && !record.qr_code && (
        <Notice>A QR tag can be generated after a conservation officer approves this record.</Notice>
      )}
      {qrValue && record.qr_code && (
        <View style={styles.qr}>
          <QRCode value={qrValue} size={180} />
          <Text style={styles.meta}>{record.qr_code}</Text>
          <Text style={styles.meta}>{qrValue}</Text>
          {!siteUrl && (
            <Notice tone="warn">
              Set EXPO_PUBLIC_SITE_URL to the website address so a printed tag opens the public plant page. This code can already be scanned inside the app.
            </Notice>
          )}
        </View>
      )}
    </Screen>
  );
}

function SubmittedRecord({ record }: { record: CachedRecord }) {
  const lifeStage = choiceLabel(record.life_stage, lifeStageChoices);
  const health = choiceLabel(record.health_status, healthChoices);
  const leaves = choiceLabel(record.leaf_traits, leafChoices);
  const flower = choiceLabel(record.flower_fruit_traits, flowerChoices);
  const gps = record.latitude != null && record.longitude != null ? `${record.latitude}, ${record.longitude}` : null;

  return (
    <View style={styles.summary}>
      {record.photos.length > 0 ? (
        <PhotoGallery photos={record.photos} height={240} radius={24} />
      ) : (
        <View style={styles.heroEmpty}>
          <Text style={styles.heroEmptyText}>No photograph yet</Text>
        </View>
      )}
      <View style={styles.pills}>
        <Badge status={record.status} />
        {lifeStage ? <Text style={styles.pill}>{lifeStage}</Text> : null}
        {health ? <Text style={styles.pill}>{health}</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Record</Text>
        <Line label="Code" value={record.code} />
        <Line label="Recorded" value={record.recorded_at ? formatWhen(record.recorded_at) : null} />
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Place</Text>
        <Line label="Name" value={record.location_name} />
        <Line label="GPS" value={gps} />
        {gps ? (
          <Button
            label="Open location"
            tone="secondary"
            onPress={() =>
              Linking.openURL(
                `https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=17/${record.latitude}/${record.longitude}`,
              )
            }
          />
        ) : null}
      </View>
      <View style={styles.metrics}>
        <Metric label="Height" value={record.height_m != null ? `${record.height_m} m` : "—"} />
        <Metric label="Trunk" value={record.trunk_diameter_cm != null ? `${record.trunk_diameter_cm} cm` : "—"} />
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Traits</Text>
        <Line label="Leaves" value={leaves} />
        <Line label="Flower or fruit" value={flower} />
        <Line label="Other" value={record.other_traits} />
      </View>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 32, fontWeight: "700", color: colors.ink },
  species: { color: colors.muted, fontSize: 16, fontStyle: "italic" },
  common: { color: colors.ink, fontSize: 16 },
  meta: { color: colors.muted, fontSize: 14 },
  summary: { gap: 12 },
  heroEmpty: {
    height: 160,
    borderRadius: 24,
    backgroundColor: "#d7e6da",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmptyText: { color: colors.forest, fontWeight: "700" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    backgroundColor: "#fff",
    color: colors.ink,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  card: { backgroundColor: "#fffcf8", borderRadius: 24, padding: 16, gap: 12 },
  section: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  line: { gap: 2, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e7eee6" },
  lineLabel: { color: "#6b726c", fontSize: 13 },
  lineValue: { color: colors.ink, fontSize: 16 },
  metrics: { flexDirection: "row", gap: 10 },
  metric: { flex: 1, backgroundColor: "#143528", borderRadius: 24, padding: 16, gap: 4 },
  metricValue: { color: "#f7fbf8", fontSize: 22, fontWeight: "700" },
  metricLabel: { color: "#c9e6d4", fontSize: 13, fontWeight: "700" },
  qr: { alignItems: "flex-start", gap: 8, backgroundColor: "#fff", padding: 16, borderRadius: 24 },
});
