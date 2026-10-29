import { useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PlantPhoto } from "@/components/PlantPhoto";
import { Button, Field, Notice } from "@/components/ui";
import { listSpecies } from "@/lib/db";
import { copyPhotoIntoApp } from "@/lib/photos";
import { fieldProblems, flowerChoices, healthChoices, leafChoices, lifeStageChoices, speciesTitle, type ChoiceOption } from "@/lib/plant";
import { colors } from "@/theme";
import type { FieldInput, Species } from "@/types";

const emptyInput: FieldInput = {
  species_id: null,
  species_label: "",
  plant_name: "",
  life_stage: "",
  height_m: "",
  trunk_diameter_cm: "",
  latitude: "",
  longitude: "",
  location_name: "",
  leaf_traits: "",
  flower_fruit_traits: "",
  health_status: "",
  other_traits: "",
  photo_uri: null,
  photo_caption: "",
  status: "submitted",
};

export function RecordForm({
  localId,
  initial,
  mode,
  submitLabel,
  onSubmit,
}: {
  localId: string;
  initial?: Partial<FieldInput>;
  mode: "create" | "revise";
  submitLabel: string;
  onSubmit: (input: FieldInput) => Promise<string | null>;
}) {
  const [input, setInput] = useState<FieldInput>({
    ...emptyInput,
    ...initial,
    plant_name: initial?.plant_name ?? "",
    life_stage: initial?.life_stage ?? "",
  });
  const [species, setSpecies] = useState<Species[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "submitted" | "revise" | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    listSpecies().then(setSpecies).catch(() => setSpecies([]));
  }, []);

  function patch(values: Partial<FieldInput>) {
    setInput((current) => ({ ...current, ...values }));
  }

  function applyPosition(position: Awaited<ReturnType<typeof Location.getCurrentPositionAsync>>) {
    patch({
      latitude: position.coords.latitude.toFixed(6),
      longitude: position.coords.longitude.toFixed(6),
    });
    setAccuracy(position.coords.accuracy);
  }

  function readPosition(accuracy: Location.Accuracy, timeoutMs: number) {
    return new Promise<Location.LocationObject | null>((resolve) => {
      let settled = false;
      let subscription: Location.LocationSubscription | null = null;
      const finish = (value: Location.LocationObject | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        subscription?.remove();
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), timeoutMs);
      Location.watchPositionAsync(
        { accuracy, distanceInterval: 0, timeInterval: 1000, mayShowUserSettingsDialog: true },
        (position) => finish(position),
        () => finish(null),
      )
        .then((next) => {
          subscription = next;
          if (settled) next.remove();
        })
        .catch(() => finish(null));
    });
  }

  async function useLocation() {
    if (locating) return;
    setLocationNote(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationNote(
          permission.canAskAgain
            ? "Allow location access when the phone asks, then tap Use my location again."
            : "Location is off for this app. Open Settings, allow location, then try again.",
        );
        return;
      }
      if (Platform.OS === "android") {
        await Location.enableNetworkProviderAsync().catch(() => undefined);
      }
      const last = await Location.getLastKnownPositionAsync();
      if (last) applyPosition(last);
      const current =
        (await readPosition(Location.Accuracy.Balanced, 10000)) ??
        (await readPosition(Location.Accuracy.Low, 8000));
      if (current) applyPosition(current);
      else if (!last) setLocationNote("This phone did not return a location.");
    } catch (error) {
      setLocationNote(error instanceof Error ? error.message : "Could not read this phone's location.");
    } finally {
      setLocating(false);
    }
  }

  async function takePhoto(source: "camera" | "library") {
    setMessage(null);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(source === "camera" ? "Camera permission is required to photograph the plant." : "Photo library permission is required.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.6 });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    try {
      const stored = await copyPhotoIntoApp(localId, uri);
      patch({ photo_uri: stored });
    } catch {
      patch({ photo_uri: uri });
      setMessage("The photo is attached, but it could not be copied into the field book folder.");
    }
  }

  async function submit(status: FieldInput["status"] = input.status) {
    const next = { ...input, status };
    const problems = fieldProblems(next);
    if (problems.length > 0) {
      setMessage(problems[0] ?? "Check the measurements.");
      return;
    }
    setSaving(mode === "create" ? status : "revise");
    setMessage(null);
    const error = await onSubmit(next);
    setSaving(null);
    if (error) setMessage(error);
    else if (status !== input.status) patch({ status });
  }

  const filtered = species.filter((item) => {
    const blob = `${item.code} ${item.scientific_name} ${item.common_name ?? ""} ${item.local_name ?? ""} ${item.family ?? ""}`.toLowerCase();
    return blob.includes(query.trim().toLowerCase());
  });

  return (
    <View style={styles.form}>
      {message && <Notice tone="warn">{message}</Notice>}
      <Field label="Plant name" value={input.plant_name} onChangeText={(plant_name) => patch({ plant_name })} placeholder="Name used in the field" />
      <Pressable accessibilityRole="button" style={styles.picker} onPress={() => setPickerOpen(true)}>
        <Text style={styles.pickerLabel}>Species</Text>
        <Text style={styles.pickerValue}>{input.species_label || "Not identified yet"}</Text>
      </Pressable>
      <ChoiceField label="Life stage" value={input.life_stage} options={lifeStageChoices} onChange={(life_stage) => patch({ life_stage })} />
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Height (m)" value={input.height_m} onChangeText={(height_m) => patch({ height_m })} keyboardType="decimal-pad" />
        </View>
        <View style={styles.half}>
          <Field label="Trunk diameter (cm)" value={input.trunk_diameter_cm} onChangeText={(trunk_diameter_cm) => patch({ trunk_diameter_cm })} keyboardType="decimal-pad" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Latitude" value={input.latitude} editable={false} placeholder="—" />
        </View>
        <View style={styles.half}>
          <Field label="Longitude" value={input.longitude} editable={false} placeholder="—" />
        </View>
      </View>
      <Button label={locating ? "Finding location…" : "Use my location"} tone="secondary" disabled={locating} onPress={useLocation} />
      {locationNote ? <Notice tone="warn">{locationNote}</Notice> : null}
      {locationNote?.includes("Settings") ? (
        <Button label="Open Settings" tone="secondary" onPress={() => Linking.openSettings()} />
      ) : null}
      {accuracy != null && <Text style={styles.accuracy}>GPS accuracy about {Math.round(accuracy)} m</Text>}
      <Field label="Place name" value={input.location_name} onChangeText={(location_name) => patch({ location_name })} placeholder="Trail, cave mouth, plot" />
      <ChoiceField label="Leaf traits" value={input.leaf_traits} options={leafChoices} onChange={(leaf_traits) => patch({ leaf_traits })} />
      <ChoiceField label="Flower or fruit" value={input.flower_fruit_traits} options={flowerChoices} onChange={(flower_fruit_traits) => patch({ flower_fruit_traits })} />
      <ChoiceField label="Health" value={input.health_status} options={healthChoices} onChange={(health_status) => patch({ health_status })} />
      <Field label="Other traits" value={input.other_traits} onChangeText={(other_traits) => patch({ other_traits })} multiline />
      {input.photo_uri ? (
        <View style={styles.photoBlock}>
          <PlantPhoto photo={{ storage_path: input.photo_uri, caption: null }} showCaption={false} height={200} radius={20} />
          <Field label="Photo caption" value={input.photo_caption} onChangeText={(photo_caption) => patch({ photo_caption })} />
          <Pressable accessibilityRole="button" onPress={() => patch({ photo_uri: null })} hitSlop={8}>
            <Text style={styles.remove}>Remove photograph</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.half}>
            <Button label="Take photo" tone="secondary" onPress={() => takePhoto("camera")} />
          </View>
          <View style={styles.half}>
            <Button label="Choose photo" tone="secondary" onPress={() => takePhoto("library")} />
          </View>
        </View>
      )}
      {mode === "create" ? (
        <View style={styles.actions}>
          <Button
            label={saving === "draft" ? "Saving…" : "Save as draft"}
            tone="secondary"
            disabled={saving != null}
            onPress={() => submit("draft")}
          />
          <Button
            label={saving === "submitted" ? "Saving…" : "Submit for review"}
            disabled={saving != null}
            onPress={() => submit("submitted")}
          />
        </View>
      ) : (
        <Button label={saving ? "Saving…" : submitLabel} disabled={saving != null} onPress={() => submit()} />
      )}

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Species guide</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Scientific, common, or local name"
            placeholderTextColor={colors.muted}
            style={styles.search}
            autoFocus
          />
          <Pressable
            style={styles.speciesRow}
            onPress={() => {
              patch({ species_id: null, species_label: "" });
              setPickerOpen(false);
            }}
          >
            <Text style={styles.speciesName}>Not identified yet</Text>
          </Pressable>
            <FlatList
            style={styles.speciesList}
            data={filtered}
            keyExtractor={(item) => item.uuid}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>No species saved on this phone yet. Open the species guide while online.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.speciesRow}
                onPress={() => {
                  patch({ species_id: item.uuid, species_label: speciesTitle(item) });
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.speciesName}>{item.scientific_name}</Text>
                <Text style={styles.speciesMeta}>
                  {item.code}
                  {item.common_name ? ` · ${item.common_name}` : ""}
                  {item.local_name ? ` · ${item.local_name}` : ""}
                </Text>
              </Pressable>
            )}
          />
          <Button label="Close" tone="secondary" onPress={() => setPickerOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
}) {
  const known = options.some((option) => option.value === value);
  const [other, setOther] = useState(Boolean(value) && !known);

  return (
    <View style={styles.choices}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = !other && value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => {
                setOther(false);
                onChange(option.value);
              }}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.choiceOn,
                pressed && (selected ? styles.chipPressedOn : styles.chipPressed),
              ]}
            >
              <Text style={[styles.chipText, selected && styles.choiceTextOn]}>{option.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setOther(true);
            if (known) onChange("");
          }}
          style={({ pressed }) => [styles.chip, other && styles.choiceOn, pressed && (other ? styles.chipPressedOn : styles.chipPressed)]}
        >
          <Text style={[styles.chipText, other && styles.choiceTextOn]}>Other</Text>
        </Pressable>
      </View>
      {other ? (
        <TextInput
          value={known ? "" : value}
          onChangeText={onChange}
          placeholder="Describe this special case"
          placeholderTextColor={colors.muted}
          maxLength={80}
          style={styles.search}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  picker: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  pickerLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  pickerValue: { color: colors.ink, fontSize: 16, marginTop: 2 },
  accuracy: { color: colors.muted, fontSize: 13 },
  photoBlock: { gap: 10 },
  remove: { color: colors.danger, fontSize: 15, fontWeight: "700" },
  actions: { gap: 10, marginTop: 4 },
  modal: { flex: 1, backgroundColor: colors.paper, padding: 16, gap: 10 },
  modalTitle: { fontSize: 24, fontWeight: "700", color: colors.ink, marginTop: 24 },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    color: colors.ink,
  },
  speciesRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  speciesName: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  speciesMeta: { color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, paddingVertical: 16 },
  speciesList: { flex: 1 },
  choiceOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  choiceTextOn: { color: "#fffdf8" },
  choices: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipText: { color: colors.forest, fontWeight: "700" },
  chipPressed: { backgroundColor: colors.okBg, borderColor: colors.forest },
  chipPressedOn: { backgroundColor: colors.forestDark },
});
