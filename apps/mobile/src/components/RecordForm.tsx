import { useEffect, useState, type ReactNode } from "react";
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
import { newId } from "@/lib/id";
import { copyPhotoIntoApp } from "@/lib/photos";
import {
  choiceLabel,
  fieldProblems,
  flowerChoices,
  healthChoices,
  invalidNumber,
  leafChoices,
  lifeStageChoices,
  speciesTitle,
  textOrNull,
  type ChoiceOption,
} from "@/lib/plant";
import { colors } from "@/theme";
import type { FieldInput, LocalPhoto, Species } from "@/types";

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
  visibility: "ordinary",
  photo_uri: null,
  photo_caption: "",
  photos: [],
  status: "submitted",
};

const STEPS = ["Plant", "Location", "Traits", "Photos", "Review"] as const;

// The first problem on one step, so the botanist can fix it before moving on.
function stepProblem(step: number, input: FieldInput): string | null {
  if (step === 0) {
    if (!textOrNull(input.plant_name)) return "Enter a plant name.";
    if (!input.species_id) return "Choose a species.";
    if (!textOrNull(input.life_stage)) return "Choose a life stage.";
    if (!textOrNull(input.height_m)) return "Enter height.";
    if (invalidNumber(input.height_m)) return "Height must be a number.";
    if (!textOrNull(input.trunk_diameter_cm)) return "Enter trunk diameter.";
    if (invalidNumber(input.trunk_diameter_cm)) return "Trunk diameter must be a number.";
  }
  if (step === 1) {
    if (!textOrNull(input.latitude) || !textOrNull(input.longitude)) return "Use my location first.";
    if (invalidNumber(input.latitude)) return "Latitude must be a number.";
    if (invalidNumber(input.longitude)) return "Longitude must be a number.";
    if (!textOrNull(input.location_name)) return "Enter a place name.";
  }
  if (step === 2) {
    if (!textOrNull(input.leaf_traits)) return "Choose leaf traits.";
    if (!textOrNull(input.flower_fruit_traits)) return "Choose flower or fruit traits.";
    if (!textOrNull(input.health_status)) return "Choose a health status.";
    if (!textOrNull(input.other_traits)) return "Enter other traits.";
  }
  if (step === 3) {
    if (input.photos.length === 0) return "Add a photo.";
    if (input.photos.some((photo) => !photo.remote_url && !textOrNull(photo.caption))) {
      return "Enter a caption for every photo.";
    }
  }
  return null;
}

// Older callers pass a single photo_uri; turn it into the photo list.
function initialPhotos(initial?: Partial<FieldInput>): LocalPhoto[] {
  if (initial?.photos) return initial.photos;
  if (initial?.photo_uri) {
    return [{ id: "first", uri: initial.photo_uri, caption: initial.photo_caption ?? "", remote_url: null }];
  }
  return [];
}

export function RecordForm({
  localId,
  initial,
  mode,
  submitLabel,
  saveLabel,
  onSubmit,
}: {
  localId: string;
  initial?: Partial<FieldInput>;
  mode: "create" | "revise";
  submitLabel: string;
  /** Revise mode only: label for a button that saves edits without submitting. */
  saveLabel?: string;
  onSubmit: (input: FieldInput) => Promise<string | null>;
}) {
  const [input, setInput] = useState<FieldInput>({
    ...emptyInput,
    ...initial,
    plant_name: initial?.plant_name ?? "",
    life_stage: initial?.life_stage ?? "",
    photos: initialPhotos(initial),
  });
  const [species, setSpecies] = useState<Species[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "submitted" | "revise" | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [step, setStep] = useState(0);

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
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 0.6,
            allowsMultipleSelection: true,
            selectionLimit: 0,
          });
    if (result.canceled) return;

    const added: LocalPhoto[] = [];
    let copyFailed = false;
    for (const asset of result.assets) {
      if (!asset.uri) continue;
      const id = newId();
      try {
        const stored = await copyPhotoIntoApp(`${localId}-${id}`, asset.uri);
        added.push({ id, uri: stored, caption: "", remote_url: null });
      } catch {
        added.push({ id, uri: asset.uri, caption: "", remote_url: null });
        copyFailed = true;
      }
    }
    if (added.length === 0) return;
    setInput((current) => ({ ...current, photos: [...current.photos, ...added] }));
    if (copyFailed) setMessage("A photo is attached, but it could not be copied into the field book folder.");
  }

  function updatePhoto(id: string, values: Partial<LocalPhoto>) {
    setInput((current) => ({
      ...current,
      photos: current.photos.map((photo) => (photo.id === id ? { ...photo, ...values } : photo)),
    }));
  }

  function removePhoto(id: string) {
    setInput((current) => ({ ...current, photos: current.photos.filter((photo) => photo.id !== id) }));
  }

  async function submit(status: FieldInput["status"] = input.status) {
    const first = input.photos[0];
    const next = { ...input, status, photo_uri: first?.uri ?? null, photo_caption: first?.caption ?? "" };
    const problems = fieldProblems(next);
    if (problems.length > 0) {
      setMessage(problems[0] ?? "Check the measurements.");
      return;
    }
    setSaving(status === "draft" ? "draft" : mode === "create" ? status : "revise");
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

  const last = STEPS.length - 1;

  function goTo(next: number) {
    setMessage(null);
    setStep(Math.max(0, Math.min(last, next)));
  }

  function goNext() {
    const problem = stepProblem(step, input);
    if (problem) {
      setMessage(problem);
      return;
    }
    goTo(step + 1);
  }

  async function finish(status?: FieldInput["status"]) {
    // Send the botanist back to the step that needs fixing.
    for (let index = 0; index < last; index += 1) {
      const problem = stepProblem(index, input);
      if (problem) {
        setStep(index);
        setMessage(problem);
        return;
      }
    }
    await submit(status);
  }

  return (
    <View style={styles.form}>
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}>
        <Text style={styles.progressText}>
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </Text>
        <View style={styles.segments}>
          {STEPS.map((name, index) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${name}`}
              onPress={() => goTo(index)}
              hitSlop={10}
              style={[styles.segment, index <= step && styles.segmentOn]}
            />
          ))}
        </View>
      </View>

      {message && <Notice tone="warn">{message}</Notice>}

      {step === 0 && (
        <>
          <Field label="Plant name *" value={input.plant_name} onChangeText={(plant_name) => patch({ plant_name })} placeholder="Name used in the field" />
          <View style={styles.choices}>
            <Text style={styles.pickerLabel}>Who can see this plant</Text>
            <View style={styles.chips}>
              {(
                [
                  ["ordinary", "Ordinary"],
                  ["rare", "Rare"],
                ] as const
              ).map(([value, label]) => {
                const selected = input.visibility === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    onPress={() => patch({ visibility: value })}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.choiceOn,
                      pressed && (selected ? styles.chipPressedOn : styles.chipPressed),
                    ]}
                  >
                    <Text style={[styles.chipText, selected && styles.choiceTextOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.accuracy}>
              Rare plants stay hidden from the public. Staff can still open and update the record.
            </Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.picker} onPress={() => setPickerOpen(true)}>
            <Text style={styles.pickerLabel}>Species *</Text>
            <Text style={styles.pickerValue}>{input.species_label || "Choose a species"}</Text>
          </Pressable>
          <ChoiceField label="Life stage *" value={input.life_stage} options={lifeStageChoices} onChange={(life_stage) => patch({ life_stage })} />
          <View style={styles.row}>
            <View style={styles.half}>
              <Field label="Height (m) *" value={input.height_m} onChangeText={(height_m) => patch({ height_m })} keyboardType="decimal-pad" />
            </View>
            <View style={styles.half}>
              <Field label="Trunk diameter (cm) *" value={input.trunk_diameter_cm} onChangeText={(trunk_diameter_cm) => patch({ trunk_diameter_cm })} keyboardType="decimal-pad" />
            </View>
          </View>
        </>
      )}

      {step === 1 && (
        <>
          <Button label={locating ? "Finding location…" : "Use my location"} disabled={locating} onPress={useLocation} />
          {locationNote ? <Notice tone="warn">{locationNote}</Notice> : null}
          {locationNote?.includes("Settings") ? (
            <Button label="Open Settings" tone="secondary" onPress={() => Linking.openSettings()} />
          ) : null}
          <View style={styles.row}>
            <View style={styles.half}>
              <Field label="Latitude *" value={input.latitude} editable={false} placeholder="—" />
            </View>
            <View style={styles.half}>
              <Field label="Longitude *" value={input.longitude} editable={false} placeholder="—" />
            </View>
          </View>
          {accuracy != null && <Text style={styles.accuracy}>GPS accuracy about {Math.round(accuracy)} m</Text>}
          <Field label="Place name *" value={input.location_name} onChangeText={(location_name) => patch({ location_name })} placeholder="Trail, cave mouth, plot" />
        </>
      )}

      {step === 2 && (
        <>
          <ChoiceField label="Leaf traits *" value={input.leaf_traits} options={leafChoices} onChange={(leaf_traits) => patch({ leaf_traits })} />
          <ChoiceField label="Flower or fruit *" value={input.flower_fruit_traits} options={flowerChoices} onChange={(flower_fruit_traits) => patch({ flower_fruit_traits })} />
          <ChoiceField label="Health *" value={input.health_status} options={healthChoices} onChange={(health_status) => patch({ health_status })} />
          <Field label="Other traits *" value={input.other_traits} onChangeText={(other_traits) => patch({ other_traits })} multiline />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.pickerLabel}>
            Photographs *{input.photos.length > 0 ? ` (${input.photos.length})` : ""}
          </Text>
          {input.photos.map((photo, index) => {
            // In revise mode, photos already in the central database cannot be removed or re-captioned here.
            const saved = mode === "revise" && photo.remote_url != null;
            return (
              <View key={photo.id} style={styles.photoBlock}>
                <PlantPhoto photo={{ storage_path: photo.uri, caption: null }} showCaption={false} height={200} radius={20} />
                {saved ? (
                  <Text style={styles.accuracy}>
                    Photo {index + 1} · already uploaded{photo.caption ? ` · ${photo.caption}` : ""}
                  </Text>
                ) : (
                  <>
                    <Field
                      label={`Photo ${index + 1} caption *`}
                      value={photo.caption}
                      onChangeText={(caption) => updatePhoto(photo.id, { caption })}
                      placeholder="Leaf, flower, bark, whole plant…"
                    />
                    <Pressable accessibilityRole="button" onPress={() => removePhoto(photo.id)} hitSlop={8}>
                      <Text style={styles.remove}>Remove photo {index + 1}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            );
          })}
          <View style={styles.row}>
            <View style={styles.half}>
              <Button
                label={input.photos.length > 0 ? "Take another" : "Take photo"}
                tone="secondary"
                onPress={() => takePhoto("camera")}
              />
            </View>
            <View style={styles.half}>
              <Button
                label={input.photos.length > 0 ? "Add from gallery" : "Choose photos"}
                tone="secondary"
                onPress={() => takePhoto("library")}
              />
            </View>
          </View>
        </>
      )}

      {step === 4 && (
        <View style={styles.review}>
          <ReviewSection title="Plant" onEdit={() => goTo(0)}>
            <ReviewRow label="Plant name" value={input.plant_name} />
            <ReviewRow label="Access" value={input.visibility === "rare" ? "Rare — staff only" : "Ordinary — public"} />
            <ReviewRow label="Species" value={input.species_label || "Not identified yet"} />
            <ReviewRow label="Life stage" value={choiceLabel(input.life_stage, lifeStageChoices)} />
            <ReviewRow label="Height" value={input.height_m ? `${input.height_m} m` : null} />
            <ReviewRow label="Trunk diameter" value={input.trunk_diameter_cm ? `${input.trunk_diameter_cm} cm` : null} />
          </ReviewSection>
          <ReviewSection title="Location" onEdit={() => goTo(1)}>
            <ReviewRow label="GPS" value={input.latitude && input.longitude ? `${input.latitude}, ${input.longitude}` : "Not recorded"} />
            <ReviewRow label="Place" value={input.location_name} />
          </ReviewSection>
          <ReviewSection title="Traits" onEdit={() => goTo(2)}>
            <ReviewRow label="Leaves" value={choiceLabel(input.leaf_traits, leafChoices)} />
            <ReviewRow label="Flower or fruit" value={choiceLabel(input.flower_fruit_traits, flowerChoices)} />
            <ReviewRow label="Health" value={choiceLabel(input.health_status, healthChoices)} />
            <ReviewRow label="Other" value={input.other_traits} />
          </ReviewSection>
          <ReviewSection title="Photos" onEdit={() => goTo(3)}>
            <ReviewRow label="Attached" value={input.photos.length === 0 ? "None" : `${input.photos.length} photo${input.photos.length === 1 ? "" : "s"}`} />
          </ReviewSection>
        </View>
      )}

      {step < last ? (
        <View style={styles.row}>
          <View style={styles.half}>
            <Button label="Back" tone="secondary" disabled={step === 0} onPress={() => goTo(step - 1)} />
          </View>
          <View style={styles.half}>
            <Button label={step === last - 1 ? "Review" : "Next"} onPress={goNext} />
          </View>
        </View>
      ) : mode === "create" ? (
        <View style={styles.actions}>
          <Button
            label={saving === "submitted" ? "Saving…" : "Submit for review"}
            disabled={saving != null}
            onPress={() => finish("submitted")}
          />
          <Button
            label={saving === "draft" ? "Saving…" : "Save as draft"}
            tone="secondary"
            disabled={saving != null}
            onPress={() => finish("draft")}
          />
          <Button label="Back" tone="secondary" disabled={saving != null} onPress={() => goTo(step - 1)} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button
            label={saving != null && saving !== "draft" ? "Saving…" : submitLabel}
            disabled={saving != null}
            // With a separate Save button this one always submits. Without one (older screens),
            // keep the previous behaviour and save with the status the screen passed in.
            onPress={() => (saveLabel ? finish("submitted") : finish())}
          />
          {saveLabel ? (
            <Button
              label={saving === "draft" ? "Saving…" : saveLabel}
              tone="secondary"
              disabled={saving != null}
              onPress={() => finish("draft")}
            />
          ) : null}
          <Button label="Back" tone="secondary" disabled={saving != null} onPress={() => goTo(step - 1)} />
        </View>
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

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <Text style={styles.reviewTitle}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${title}`} onPress={onEdit} hitSlop={12}>
          <Text style={styles.reviewEdit}>Edit</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value?.trim() ? value : "—"}</Text>
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
  progress: { gap: 8, marginBottom: 4 },
  progressText: { color: colors.forest, fontSize: 15, fontWeight: "700" },
  segments: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  segmentOn: { backgroundColor: colors.forest },
  review: { gap: 10 },
  reviewCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, gap: 8 },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  reviewEdit: { color: colors.forest, fontSize: 15, fontWeight: "700" },
  reviewRow: { flexDirection: "row", gap: 12 },
  reviewLabel: { color: colors.muted, fontSize: 14, width: 110 },
  reviewValue: { color: colors.ink, fontSize: 14, flex: 1 },
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
