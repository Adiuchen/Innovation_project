import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PlantPhoto } from "@/components/PlantPhoto";
import { Button, Field, Loading, Notice, Screen } from "@/components/ui";
import { getStaffEvent, saveEvent } from "@/lib/events";
import { copyPhotoIntoApp } from "@/lib/photos";
import { combineParkDateTime, splitParkDateTime } from "@/lib/park-time";
import { firstParam } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";
import { newId } from "@/lib/id";

export function EventEditor({ userId, eventId }: { userId: string; eventId?: string }) {
  const { t } = usePreferences();
  const params = useLocalSearchParams<{ notice?: string }>();
  const notice = firstParam(params.notice);
  const [ready, setReady] = useState(!eventId);
  const [missing, setMissing] = useState(false);
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [message, setMessage] = useState<string | null>(notice || null);
  const [saving, setSaving] = useState(false);
  const photoKey = useState(() => newId())[0];

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    getStaffEvent(eventId).then((result) => {
      if (cancelled) return;
      if (result.error) setMessage(result.error);
      if (!result.event) {
        setMissing(true);
        setReady(true);
        return;
      }
      const start = splitParkDateTime(result.event.starts_at);
      const end = splitParkDateTime(result.event.ends_at);
      setTitle(result.event.title);
      setPlace(result.event.location_name ?? "");
      setDescription(result.event.description ?? "");
      setStartDate(start.date);
      setStartTime(start.time);
      setEndDate(end.date);
      setEndTime(end.time);
      setExistingImage(result.event.image_path);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function pickPhoto(source: "camera" | "library") {
    setMessage(null);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(source === "camera" ? t.photoCamera : t.photoLibrary);
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
      setPhotoUri(await copyPhotoIntoApp(photoKey, uri));
    } catch {
      setPhotoUri(uri);
    }
    setRemovePhoto(false);
  }

  async function submit(status: "draft" | "published") {
    const trimmed = title.trim();
    if (!trimmed) {
      setMessage(t.eventTitleRequired);
      return;
    }
    const starts = combineParkDateTime(startDate, startTime);
    const ends = combineParkDateTime(endDate, endTime);
    if (starts === "invalid" || ends === "invalid") {
      setMessage(t.eventTimeInvalid);
      return;
    }
    if (!starts) {
      setMessage(t.eventStartRequired);
      return;
    }
    if (ends && ends < starts) {
      setMessage(t.eventEndBeforeStart);
      return;
    }

    setSaving(true);
    setMessage(null);
    const result = await saveEvent({
      uuid: eventId,
      userId,
      title: trimmed,
      description: description.trim() || null,
      location_name: place.trim() || null,
      starts_at: starts,
      ends_at: ends,
      status,
      photoUri,
      removePhoto,
    });
    setSaving(false);
    if (result.error) {
      setMessage(result.error);
      if (!eventId && result.uuid) {
        router.replace({ pathname: "/events/[id]", params: { id: result.uuid, notice: result.error } });
      }
      return;
    }
    router.back();
  }

  if (!ready) return <Loading label={t.events} />;
  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">{t.noEvents}</Notice>
      </Screen>
    );
  }

  const preview = photoUri ?? (!removePhoto ? existingImage : null);

  return (
    <Screen>
      {message ? <Notice tone="danger">{message}</Notice> : null}
      <Field label={t.eventTitle} value={title} onChangeText={setTitle} />
      <Field label={t.place} value={place} onChangeText={setPlace} />
      <Field label={`${t.eventStarts} · ${t.eventDate}`} value={startDate} onChangeText={setStartDate} placeholder="2026-10-21" autoCapitalize="none" />
      <Field label={`${t.eventStarts} · ${t.eventTime}`} value={startTime} onChangeText={setStartTime} placeholder="14:30" autoCapitalize="none" />
      <Field label={`${t.eventEnds} · ${t.eventDate}`} value={endDate} onChangeText={setEndDate} placeholder="2026-10-21" autoCapitalize="none" />
      <Field label={`${t.eventEnds} · ${t.eventTime}`} value={endTime} onChangeText={setEndTime} placeholder="14:30" autoCapitalize="none" />
      <Notice>
        {t.eventEndsHint} {t.parkTimeHint}
      </Notice>
      <Field label={t.description} value={description} onChangeText={setDescription} multiline />
      {preview ? <PlantPhoto photo={{ storage_path: preview, caption: null }} showCaption={false} /> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label={t.takePhoto} tone="secondary" onPress={() => pickPhoto("camera")} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t.choosePhoto} tone="secondary" onPress={() => pickPhoto("library")} />
        </View>
      </View>
      {existingImage && !photoUri ? (
        <Button
          label={removePhoto ? t.keepPhoto : t.removeEventPhoto}
          tone="secondary"
          onPress={() => setRemovePhoto((current) => !current)}
        />
      ) : null}
      <Button label={saving ? t.saving : t.saveDraft} tone="secondary" disabled={saving} onPress={() => submit("draft")} />
      <Button label={saving ? t.saving : t.publish} disabled={saving} onPress={() => submit("published")} />
    </Screen>
  );
}
