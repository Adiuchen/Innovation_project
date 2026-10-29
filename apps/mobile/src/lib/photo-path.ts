import type { PhotoRef } from "@/types";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|avif)$/i;

export function storageObjectPath(storagePath: string, bucket = "plant-photos") {
  const trimmed = storagePath.trim();
  if (!trimmed || trimmed.startsWith("file:") || trimmed.startsWith("content:")) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    const relative = trimmed.replace(/^\/+/, "");
    if (!relative || relative.endsWith("/")) return null;
    return relative.startsWith(`${bucket}/`) ? relative.slice(bucket.length + 1) : relative;
  }

  try {
    const url = new URL(trimmed);
    const marker = "/storage/v1/object/";
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    const parts = url.pathname
      .slice(index + marker.length)
      .split("/")
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));
    const bucketIndex = parts.indexOf(bucket);
    if (bucketIndex === -1 || bucketIndex === parts.length - 1) return null;
    return parts.slice(bucketIndex + 1).join("/");
  } catch {
    return null;
  }
}

export function isDisplayablePhoto(storagePath: string) {
  if (storagePath.startsWith("file:") || storagePath.startsWith("content:")) return true;
  if (storageObjectPath(storagePath)) return true;
  if (!/^https?:\/\//i.test(storagePath)) return false;
  try {
    return IMAGE_EXT.test(new URL(storagePath).pathname);
  } catch {
    return false;
  }
}

export function speciesPhoto(photos: PhotoRef[], updatedAt?: (storagePath: string) => string | null) {
  const images = photos.filter((photo) => photo.storage_path && isDisplayablePhoto(photo.storage_path));
  const stored = images.filter((photo) => storageObjectPath(photo.storage_path));
  const candidates = stored.length > 0 ? stored : images;
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort((left, right) => {
    const leftTime = updatedAt?.(left.storage_path) ?? "";
    const rightTime = updatedAt?.(right.storage_path) ?? "";
    if (leftTime === rightTime) return 0;
    return leftTime < rightTime ? -1 : 1;
  });
  const chosen = ranked[ranked.length - 1];
  if (!chosen) return null;
  const ownCaption = chosen.caption?.trim() || null;
  if (ownCaption) return { storage_path: chosen.storage_path, caption: ownCaption };
  // A link that is not an image can still be the caption for this species photograph.
  const strayCaptions = [
    ...new Set(
      photos
        .filter((photo) => !isDisplayablePhoto(photo.storage_path))
        .map((photo) => photo.caption?.trim())
        .filter((caption): caption is string => Boolean(caption)),
    ),
  ];
  return { storage_path: chosen.storage_path, caption: strayCaptions.length === 1 ? strayCaptions[0] : null };
}
