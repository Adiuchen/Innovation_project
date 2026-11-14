import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PlantPhoto } from "@/components/PlantPhoto";
import { Button, Field, Loading, Notice, Screen } from "@/components/ui";
import { listSpecies } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import {
  addPendingUpdatePhoto,
  listUpdatePhotos,
  loadPlantUpdate,
  removePendingUpdatePhoto,
  savePlantUpdate,
  updateProblems,
  type LoadedPlantUpdate,
  type PlantUpdateDraft,
  type UpdatePhoto,
} from "@/lib/plant-updates";
import { firstParam, flowerChoices, healthChoices, leafChoices, lifeStageChoices, speciesTitle, type ChoiceOption } from "@/lib/plant";
import { copyPhotoIntoApp } from "@/lib/photos";
import { usePreferences } from "@/lib/preferences";
import { colors } from "@/theme";
import type { Species } from "@/types";

export default function PlantUpdateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const updateId = firstParam(id);
  const { profile, online } = useAuth();
  const { t } = usePreferences();
  const [update, setUpdate] = useState<LoadedPlantUpdate | null>(null);
  const [draft, setDraft] = useState<PlantUpdateDraft | null>(null);
  const [photos, setPhotos] = useState<UpdatePhoto[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [working, setWorking] = useState<"save" | "submit" | "photo" | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== "botanist") return;
    let cancelled = false;
    Promise.all([loadPlantUpdate(updateId), listSpecies()])
      .then(async ([loaded, guide]) => {
        if (cancelled) return;
        setSpecies(guide);
        if (!loaded.update) {
          setMissing(true);
          setMessage(loaded.error);
          return;
        }
        setUpdate(loaded.update);
        setDraft(loaded.update.draft);
        const pictures = await listUpdatePhotos(loaded.update.plantRecordId, loaded.update.uuid);
        if (cancelled) return;
        setPhotos(pictures.photos);
        if (pictures.error) setMessage(pictures.error);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, updateId]);

  if (!profile) return null;
  if (!draft || !update) {
    return (
      <Screen>
        {missing ? <Notice tone="warn">{message || "This update is no longer open."}</Notice> : <Loading label="Loading update…" />}
      </Screen>
    );
  }

  const form = draft;
  const row = update;
  const locked = row.status !== "open";
  const selectedSpecies = species.find((item) => item.uuid === form.species_id);
  const speciesLabel = form.new_species
    ? t.newSpecies
    : selectedSpecies
      ? speciesTitle(selectedSpecies)
      : form.scientific_name || "Choose a species";

  function patch(values: Partial<PlantUpdateDraft>) {
    if (locked) return;
    setDraft((current) => (current ? { ...current, ...values } : current));
    setSaved(null);
  }

  function chooseSpecies(item: Species | null) {
    if (!item) {
      patch({
        species_id: null,
        new_species: true,
        scientific_name: "",
        common_name: "",
        local_name: "",
        family: "",
        genus: "",
        description: "",
        conservation_status: "",
        distribution: "",
        ecological_info: "",
        cultural_significance: "",
      });
    } else {
      patch({
        species_id: item.uuid,
        new_species: false,
        scientific_name: item.scientific_name,
        common_name: item.common_name ?? "",
        local_name: item.local_name ?? "",
        family: item.family ?? "",
        genus: item.genus ?? "",
        description: item.description ?? "",
        conservation_status: item.conservation_status ?? "",
        distribution: item.distribution ?? "",
        ecological_info: item.ecological_info ?? "",
        cultural_significance: item.cultural_significance ?? "",
      });
    }
    setPickerOpen(false);
  }

  async function useLocation() {
    setMessage(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setMessage("Location permission is required.");
      return;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    patch({
      latitude: position.coords.latitude.toFixed(6),
      longitude: position.coords.longitude.toFixed(6),
    });
  }

  async function persist(intent: "draft" | "submit") {
    if (!online) {
      setMessage("Connect to the network before saving this update.");
      return;
    }
    if (intent === "submit") {
      const problem = updateProblems(form);
      if (problem) {
        setMessage(problem);
        return;
      }
    }
    setWorking(intent === "submit" ? "submit" : "save");
    setMessage(null);
    const error = await savePlantUpdate(row.uuid, form, intent);
    setWorking(null);
    if (error) {
      setMessage(error);
      return;
    }
    if (intent === "submit") {
      router.back();
      return;
    }
    setSaved(t.updateSaved);
  }

  async function addPhoto(source: "camera" | "library") {
    if (!online) {
      setMessage("Connect to the network before adding a photo.");
      return;
    }
    if (!caption.trim()) {
      setMessage("Enter a photo caption.");
      return;
    }
    setMessage(null);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(source === "camera" ? "Camera permission is required." : "Photo library permission is required.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.6 });
    if (result.canceled || !result.assets[0]?.uri) return;
    setWorking("photo");
    let uri = result.assets[0].uri;
    try {
      uri = await copyPhotoIntoApp(`${row.uuid}-photo`, uri);
    } catch {
      // The picker uri can still be uploaded if the local copy fails.
    }
    const error = await addPendingUpdatePhoto(row.plantRecordId, row.uuid, uri, caption);
    if (error) {
      setWorking(null);
      setMessage(error);
      return;
    }
    const pictures = await listUpdatePhotos(row.plantRecordId, row.uuid);
    setPhotos(pictures.photos);
    setCaption("");
    setWorking(null);
    setSaved(t.updateSaved);
  }

  async function removePhoto(photoId: string) {
    setMessage(null);
    const error = await removePendingUpdatePhoto(photoId, row.uuid);
    if (error) {
      setMessage(error);
      return;
    }
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
  }

  function toggleHide(photoId: string) {
    const hidden = form.hide_photo_ids.includes(photoId);
    patch({
      hide_photo_ids: hidden ? form.hide_photo_ids.filter((item) => item !== photoId) : [...form.hide_photo_ids, photoId],
    });
  }

  const filtered = species.filter((item) => {
    const blob = `${item.code} ${item.scientific_name} ${item.common_name ?? ""} ${item.local_name ?? ""}`.toLowerCase();
    return blob.includes(query.trim().toLowerCase());
  });
  const livePhotos = photos.filter((photo) => !photo.pending);
  const pendingPhotos = photos.filter((photo) => photo.pending);

  return (
    <Screen>
      <Text style={styles.title}>{form.plant_name || t.updatesRequested}</Text>
      <Notice tone="warn">{t.updateFormNote}</Notice>
      {locked ? <Notice tone="warn">{t.updateWaiting}</Notice> : null}
      {message ? <Notice tone="danger">{message}</Notice> : null}
      {saved && !message ? <Notice tone="ok">{saved}</Notice> : null}

      <Field label="Plant name *" value={form.plant_name} editable={!locked} onChangeText={(plant_name) => patch({ plant_name })} />
      <Text style={styles.label}>Who can see this plant</Text>
      <View style={styles.chips}>
        <Chip label="Ordinary — public" selected={form.visibility === "ordinary"} onPress={() => patch({ visibility: "ordinary" })} />
        <Chip label="Rare — staff only" selected={form.visibility === "rare"} onPress={() => patch({ visibility: "rare" })} />
      </View>

      <Text style={styles.label}>Species *</Text>
      <Pressable style={styles.picker} disabled={locked} onPress={() => setPickerOpen(true)}>
        <Text style={styles.pickerText}>{speciesLabel}</Text>
      </Pressable>
      <Field label="Scientific name *" value={form.scientific_name} editable={!locked} onChangeText={(scientific_name) => patch({ scientific_name })} />
      <Field label="Common name" value={form.common_name} editable={!locked} onChangeText={(common_name) => patch({ common_name })} />
      <Field label="Local name" value={form.local_name} editable={!locked} onChangeText={(local_name) => patch({ local_name })} />
      <Field label="Family" value={form.family} editable={!locked} onChangeText={(family) => patch({ family })} />
      <Field label="Genus" value={form.genus} editable={!locked} onChangeText={(genus) => patch({ genus })} />
      <Field label="Conservation status" value={form.conservation_status} editable={!locked} onChangeText={(conservation_status) => patch({ conservation_status })} />
      <Field label="Distribution" value={form.distribution} editable={!locked} onChangeText={(distribution) => patch({ distribution })} />
      <Field label="Description" value={form.description} editable={!locked} multiline onChangeText={(description) => patch({ description })} />
      <Field label="Ecology" value={form.ecological_info} editable={!locked} multiline onChangeText={(ecological_info) => patch({ ecological_info })} />
      <Field label="Cultural significance" value={form.cultural_significance} editable={!locked} multiline onChangeText={(cultural_significance) => patch({ cultural_significance })} />

      <Field label="Height (m) *" value={form.height_m} editable={!locked} keyboardType="decimal-pad" onChangeText={(height_m) => patch({ height_m })} />
      <Field label="Trunk diameter (cm) *" value={form.trunk_diameter_cm} editable={!locked} keyboardType="decimal-pad" onChangeText={(trunk_diameter_cm) => patch({ trunk_diameter_cm })} />
      <Field label="Latitude *" value={form.latitude} editable={!locked} keyboardType="decimal-pad" onChangeText={(latitude) => patch({ latitude })} />
      <Field label="Longitude *" value={form.longitude} editable={!locked} keyboardType="decimal-pad" onChangeText={(longitude) => patch({ longitude })} />
      {!locked ? <Button label="Use my location" tone="secondary" onPress={() => useLocation().catch(() => setMessage("Could not read this phone's location."))} /> : null}
      <Field label="Place name *" value={form.location_name} editable={!locked} onChangeText={(location_name) => patch({ location_name })} />

      <ChoiceField label="Life stage *" value={form.life_stage} options={lifeStageChoices} onChange={(life_stage) => patch({ life_stage })} />
      <ChoiceField label="Health *" value={form.health_status} options={healthChoices} onChange={(health_status) => patch({ health_status })} />
      <ChoiceField label="Leaves *" value={form.leaf_traits} options={leafChoices} onChange={(leaf_traits) => patch({ leaf_traits })} />
      <ChoiceField label="Flower or fruit *" value={form.flower_fruit_traits} options={flowerChoices} onChange={(flower_fruit_traits) => patch({ flower_fruit_traits })} />
      <Field label="Other traits *" value={form.other_traits} editable={!locked} multiline onChangeText={(other_traits) => patch({ other_traits })} />

      {livePhotos.length > 0 ? <Text style={styles.label}>Current photos</Text> : null}
      {livePhotos.map((photo) => {
        const hidden = form.hide_photo_ids.includes(photo.id);
        return (
          <View key={photo.id} style={styles.photo}>
            <PlantPhoto photo={{ storage_path: photo.storage_path, caption: photo.caption }} height={160} />
            {!locked ? (
              <Pressable onPress={() => toggleHide(photo.id)}>
                <Text style={[styles.link, hidden && styles.linkOn]}>{hidden ? "Will be removed if approved" : "Remove this photo if approved"}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {pendingPhotos.length > 0 ? <Text style={styles.label}>{t.pendingPhoto}</Text> : null}
      {pendingPhotos.map((photo) => (
        <View key={photo.id} style={styles.photo}>
          <PlantPhoto photo={{ storage_path: photo.storage_path, caption: photo.caption }} height={160} />
          {!locked ? (
            <Pressable onPress={() => removePhoto(photo.id)}>
              <Text style={styles.remove}>Remove new photo</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      {!locked ? (
        <>
          <Field label="New photo caption" value={caption} onChangeText={setCaption} placeholder="Leaf, flower, bark, whole plant…" />
          <View style={styles.row}>
            <View style={styles.half}>
              <Button label={working === "photo" ? "Saving…" : t.takePhoto} tone="secondary" disabled={working != null} onPress={() => addPhoto("camera")} />
            </View>
            <View style={styles.half}>
              <Button label={t.choosePhoto} tone="secondary" disabled={working != null} onPress={() => addPhoto("library")} />
            </View>
          </View>
          <Button label={working === "submit" ? "Saving…" : t.submitUpdate} disabled={working != null} onPress={() => persist("submit")} />
          <Button label={working === "save" ? "Saving…" : t.saveUpdate} tone="secondary" disabled={working != null} onPress={() => persist("draft")} />
        </>
      ) : null}

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.title}>Species</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Scientific, common, or local name"
            placeholderTextColor={colors.muted}
            style={styles.search}
            autoFocus
          />
          <Pressable style={styles.speciesRow} onPress={() => chooseSpecies(null)}>
            <Text style={styles.speciesName}>{t.newSpecies}</Text>
          </Pressable>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.uuid}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.speciesRow} onPress={() => chooseSpecies(item)}>
                <Text style={styles.speciesName}>{item.scientific_name}</Text>
                <Text style={styles.speciesMeta}>
                  {item.code}
                  {item.common_name ? ` · ${item.common_name}` : ""}
                </Text>
              </Pressable>
            )}
          />
          <Button label="Close" tone="secondary" onPress={() => setPickerOpen(false)} />
        </View>
      </Modal>
    </Screen>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
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
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = !other && value === option.value;
          return <Chip key={option.value} label={option.label} selected={selected} onPress={() => { setOther(false); onChange(option.value); }} />;
        })}
        <Chip
          label="Other"
          selected={other}
          onPress={() => {
            setOther(true);
            if (known) onChange("");
          }}
        />
      </View>
      {other ? (
        <TextInput
          value={known ? "" : value}
          onChangeText={onChange}
          placeholder="Describe this special case"
          placeholderTextColor={colors.muted}
          style={styles.search}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", color: colors.ink },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.ink, fontSize: 14 },
  chipTextOn: { color: "#fffdf8", fontWeight: "700" },
  picker: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", paddingHorizontal: 12 },
  pickerText: { color: colors.ink, fontSize: 16 },
  photo: { gap: 8 },
  link: { color: colors.forest, fontWeight: "700" },
  linkOn: { color: colors.warning },
  remove: { color: colors.danger, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  block: { gap: 8 },
  modal: { flex: 1, backgroundColor: colors.paper, padding: 16, paddingTop: 48, gap: 12 },
  search: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: "#fff", paddingHorizontal: 12, color: colors.ink, fontSize: 16 },
  speciesRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  speciesName: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  speciesMeta: { color: colors.muted, marginTop: 2 },
});
