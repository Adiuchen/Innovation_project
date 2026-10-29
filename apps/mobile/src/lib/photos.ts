import { Directory, File, FileMode, Paths } from "expo-file-system";
import { isDisplayablePhoto, storageObjectPath } from "@/lib/photo-path";
import { photoBucket, supabase } from "@/lib/supabase";
import type { PhotoRef } from "@/types";

function photoError(message: string) {
  if (/bucket not found|nosuchbucket/i.test(message)) {
    return "Photographs cannot reach the central database yet. Run supabase/storage.sql in the Supabase SQL editor to create the plant-photos bucket. This record stays on the phone.";
  }
  return message;
}

export async function copyPhotoIntoApp(localId: string, sourceUri: string) {
  const directory = new Directory(Paths.document, "photos");
  directory.create({ intermediates: true, idempotent: true });
  const destination = new File(directory, `${localId}.jpg`);
  const source = new File(sourceUri);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

export async function deleteLocalPhoto(uri: string | null) {
  if (!uri || uri.startsWith("http")) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The field record is still valid if the local file is already gone.
  }
}

export async function uploadPlantPhoto(userId: string, localId: string, uri: string) {
  try {
    const file = new File(uri);
    const bytes = await file.bytes();
    const path = `${userId}/${localId}.jpg`;
    const { error } = await supabase.storage.from(photoBucket).upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) return { url: null, error: photoError(error.message) };
    return { url: path, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the photograph.";
    return { url: null, error: photoError(message) };
  }
}

function fileNameForPhoto(storagePath: string) {
  const key = storageObjectPath(storagePath) ?? storagePath;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  const match = key.split("?")[0]?.match(/\.([a-zA-Z0-9]+)$/);
  const extension = match?.[1]?.toLowerCase();
  const safe = extension === "jpeg" ? "jpg" : extension;
  const suffix = safe && ["jpg", "png", "gif", "webp", "heic", "avif"].includes(safe) ? safe : "jpg";
  return `${hash.toString(16)}.${suffix}`;
}

function referenceFile(storagePath: string) {
  const directory = new Directory(Paths.document, "reference-photos");
  directory.create({ intermediates: true, idempotent: true });
  return new File(directory, fileNameForPhoto(storagePath));
}

function hasImageSignature(head: Uint8Array) {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true;
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return true;
  if (head.length >= 6 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return true;
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return true;
  }
  return head.length >= 12 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70;
}

function looksLikeImage(file: File) {
  if (!file.exists || file.size < 32) return false;
  try {
    const handle = file.open(FileMode.ReadOnly);
    try {
      return hasImageSignature(handle.readBytesSync(16));
    } finally {
      handle.close();
    }
  } catch {
    return false;
  }
}

function discard(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // A failed copy should not block a later download.
  }
}

async function remoteImageUrl(storagePath: string) {
  const objectPath = storageObjectPath(storagePath);
  if (objectPath) {
    // Public object links return "Bucket not found" because plant-photos is private.
    const signed = await supabase.storage.from(photoBucket).createSignedUrl(objectPath, 60 * 60);
    return signed.error || !signed.data?.signedUrl ? null : signed.data.signedUrl;
  }
  if (/^https?:\/\//i.test(storagePath) && isDisplayablePhoto(storagePath)) return storagePath;
  return null;
}

async function cacheRemote(storagePath: string, remote: string) {
  const cached = referenceFile(storagePath);
  if (looksLikeImage(cached)) return cached.uri;
  discard(cached);
  try {
    const downloaded = await File.downloadFileAsync(remote, cached, { idempotent: true });
    if (looksLikeImage(downloaded)) return downloaded.uri;
    discard(downloaded);
  } catch {
    discard(cached);
  }

  const objectPath = storageObjectPath(storagePath);
  if (!objectPath) return null;
  try {
    const { data, error } = await supabase.storage.from(photoBucket).download(objectPath);
    if (error || !data) return null;
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (!hasImageSignature(bytes)) return null;
    if (!cached.exists) cached.create();
    await cached.write(bytes);
    return looksLikeImage(cached) ? cached.uri : null;
  } catch {
    return null;
  }
}

export async function displayUri(storagePath: string, options?: { refresh?: boolean }) {
  if (!storagePath) return null;
  if (storagePath.startsWith("file:") || storagePath.startsWith("content:")) return storagePath;
  try {
    const cached = referenceFile(storagePath);
    if (options?.refresh) discard(cached);
    else if (looksLikeImage(cached)) return cached.uri;
  } catch {
    // The signed address can still be shown when the phone cannot use its file cache.
  }
  const remote = await remoteImageUrl(storagePath);
  if (!remote) return null;
  try {
    const saved = await cacheRemote(storagePath, remote);
    if (saved) return saved;
  } catch {
    // A signed address can still be shown while this phone is online.
  }
  return options?.refresh ? null : remote;
}

export async function photoTimestamps() {
  const times = new Map<string, string>();
  const root = await supabase.storage.from(photoBucket).list("", { limit: 1000 });
  if (root.error || !root.data) return times;
  for (const entry of root.data) {
    if (!entry.id) {
      const nested = await supabase.storage.from(photoBucket).list(entry.name, { limit: 1000 });
      for (const file of nested.data ?? []) {
        if (file.updated_at) times.set(`${entry.name}/${file.name}`, file.updated_at);
      }
      continue;
    }
    if (entry.updated_at) times.set(entry.name, entry.updated_at);
  }
  return times;
}

export async function cachePhotoFiles(photos: PhotoRef[]) {
  const visible = photos.filter((photo) => photo.storage_path && isDisplayablePhoto(photo.storage_path));
  let cursor = 0;
  async function worker() {
    while (cursor < visible.length) {
      const photo = visible[cursor];
      cursor += 1;
      if (!photo || photo.storage_path.startsWith("file:") || photo.storage_path.startsWith("content:")) continue;
      await displayUri(photo.storage_path);
    }
  }
  const workers = Math.min(3, visible.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return visible;
}
