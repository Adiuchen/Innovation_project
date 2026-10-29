"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createRecord } from "@/app/botanist/actions";
import { ChoiceField } from "@/components/ChoiceField";
import { SpeciesSelect } from "@/components/SpeciesSelect";
import {
  cacheSpecies,
  draftFromForm,
  listDrafts,
  loadCachedSpecies,
  saveDraft,
  syncDrafts,
  type CachedSpecies,
  type FieldDraft,
} from "@/lib/field-drafts";
import { flowerOptions, healthOptions, leafOptions, lifeStageOptions } from "@/lib/field-choices";
import type { Copy } from "@/lib/i18n";
import { PHOTO_TOO_LARGE, PHOTO_WRONG_TYPE, photoProblemMessage } from "@/lib/photos";

export function FieldRecordForm({
  species,
  t,
  serverError,
}: {
  species: CachedSpecies[];
  t: Copy;
  serverError?: string;
}) {
  const router = useRouter();
  const [choices, setChoices] = useState(species);
  const [drafts, setDrafts] = useState<FieldDraft[]>([]);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [speciesFormKey, setSpeciesFormKey] = useState(0);

  async function refreshDrafts() {
    setDrafts(await listDrafts());
  }

  async function uploadWaiting() {
    setUploading(true);
    const result = await syncDrafts();
    await refreshDrafts();
    setUploading(false);
    if (result.error) setMessage(photoMessage(result.error, t));
    else if (result.uploaded > 0) {
      setMessage(`${t.uploadedCount}: ${result.uploaded}`);
      router.refresh();
    }
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    cacheSpecies(species).catch(() => undefined);
    loadCachedSpecies().then((cached) => {
      if (species.length === 0 && cached.length > 0) setChoices(cached);
    });
    listDrafts().then(setDrafts);
    if (navigator.onLine) uploadWaiting();

    function onOnline() {
      setOnline(true);
      uploadWaiting();
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // Upload once when this form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage(t.locationFailed);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = document.querySelector<HTMLInputElement>("input[name=latitude]");
        const longitude = document.querySelector<HTMLInputElement>("input[name=longitude]");
        if (latitude) latitude.value = position.coords.latitude.toFixed(6);
        if (longitude) longitude.value = position.coords.longitude.toFixed(6);
      },
      () => setMessage(t.locationFailed),
    );
  }

  return (
    <form
      action={createRecord}
      className="space-y-3"
      onSubmit={async (event) => {
        if (navigator.onLine) return;
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const draft = draftFromForm(formData, choices);
        const photo = formData.get("photo");
        if (photo instanceof File && photo.size > 0) {
          const problem = photoProblemMessage(photo);
          if (problem) {
            setMessage(photoMessage(problem, t));
            return;
          }
          draft.photoBlob = photo;
          draft.photoName = photo.name;
          draft.photoType = photo.type;
        }
        await saveDraft(draft);
        event.currentTarget.reset();
        setSpeciesFormKey((key) => key + 1);
        if (preview) URL.revokeObjectURL(preview);
        setPreview("");
        setMessage(t.savedOnPhone);
        await refreshDrafts();
      }}
    >
      <p className={`rounded px-3 py-2 text-sm ${online ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
        {online ? t.onlineNotice : t.offlineNotice}
      </p>
      {serverError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">{serverError}</p>}
      {message && <p className="text-sm text-neutral-700">{message}</p>}
      <section className="surface space-y-3 p-4">
        <h2 className="font-medium">{t.photos}</h2>
        <label className="block text-sm">
          {t.photoUrl}
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (preview) URL.revokeObjectURL(preview);
              if (!file || file.size === 0) {
                setPreview("");
                return;
              }
              const problem = photoProblemMessage(file);
              if (problem) {
                setMessage(photoMessage(problem, t));
                event.target.value = "";
                setPreview("");
                return;
              }
              setMessage("");
              setPreview(URL.createObjectURL(file));
            }}
          />
          <span className="mt-1 block text-neutral-500">{t.photoHint}</span>
        </label>
        {preview && (
          // Preview is a local file chosen on this phone.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t.photoUrl} className="max-h-80 rounded-lg border" />
        )}
        <Field name="photo_caption" label={t.photoCaption} />
      </section>
      <section className="surface space-y-3 p-4">
        <Field name="plant_name" label={t.plantName} required />
        <SpeciesSelect key={speciesFormKey} t={t} species={choices} />
        <div key={speciesFormKey} className="space-y-3">
          <ChoiceField name="life_stage" label={t.lifeStage} options={lifeStageOptions(t)} otherLabel={t.otherDetail} />
          <ChoiceField name="health_status" label={t.health} options={healthOptions(t)} otherLabel={t.otherDetail} />
          <ChoiceField name="leaf_traits" label={t.leafTraits} options={leafOptions(t)} otherLabel={t.otherDetail} />
          <ChoiceField name="flower_fruit_traits" label={t.flowerFruit} options={flowerOptions(t)} otherLabel={t.otherDetail} />
        </div>
        <Field name="other_traits" label={t.otherTraits} />
      </section>
      <section className="surface space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field name="latitude" label={t.latitude} />
          <Field name="longitude" label={t.longitude} />
          <Field name="height_m" label={t.height} />
          <Field name="trunk_diameter_cm" label={t.trunk} />
        </div>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={useMyLocation}>
          {t.useMyLocation}
        </button>
        <Field name="location_name" label={t.placeName} />
      </section>
      <label className="block text-sm">
        {t.saveAs}
        <select className="mt-1 w-full rounded-lg border px-3 py-2" name="status" defaultValue="submitted">
          <option value="draft">{t.draft}</option>
          <option value="submitted">{t.submitForReview}</option>
        </select>
      </label>
      <button className="btn" type="submit">
        {t.save}
      </button>
      {drafts.length > 0 && (
        <section className="surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">
              {t.pendingUploads} ({drafts.length})
            </h2>
            <button className="btn" type="button" disabled={!online || uploading} onClick={uploadWaiting}>
              {t.syncNow}
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {drafts.map((draft) => (
              <li key={draft.localId}>
                {draft.plantName || draft.speciesLabel || t.unidentified}
                {draft.locationName ? ` · ${draft.locationName}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </form>
  );
}

function photoMessage(error: string, t: Copy) {
  if (error === PHOTO_TOO_LARGE) return t.photoTooLarge;
  if (error === PHOTO_WRONG_TYPE) return t.photoType;
  return error;
}

function Field({ name, label, area, required }: { name: string; label: string; area?: boolean; required?: boolean }) {
  return (
    <label className="block text-sm">
      {label}
      {area ? (
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" name={name} rows={3} required={required} />
      ) : (
        <input className="mt-1 w-full rounded-lg border px-3 py-2" name={name} required={required} />
      )}
    </label>
  );
}
