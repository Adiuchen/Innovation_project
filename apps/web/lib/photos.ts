export const PHOTO_BUCKET = "plant-photos";
export const PHOTO_TOO_LARGE = "Photo must be 5 MB or smaller.";
export const PHOTO_WRONG_TYPE = "Use a JPEG, PNG, WEBP, or GIF photo.";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type PhotoClient = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array,
        options: { contentType: string; upsert: boolean },
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export function normalizedPhotoType(file: File) {
  const type = file.type.toLowerCase();
  if (type === "image/jpg" || type === "image/pjpeg") return "image/jpeg";
  if (PHOTO_TYPES.includes(type)) return type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "";
}

export function photoProblemMessage(file: File) {
  if (file.size > MAX_PHOTO_BYTES) return PHOTO_TOO_LARGE;
  if (!normalizedPhotoType(file)) return PHOTO_WRONG_TYPE;
  return null;
}

export async function uploadPlantPhoto(supabase: PhotoClient, userId: string, file: File) {
  const problem = photoProblemMessage(file);
  if (problem) return { path: null, error: problem };

  const contentType = normalizedPhotoType(file);
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.slice("image/".length);
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export function storageObjectPath(storagePath: string) {
  const trimmed = storagePath.trim();
  const markers = [
    `/object/public/${PHOTO_BUCKET}/`,
    `/object/sign/${PHOTO_BUCKET}/`,
    `/object/authenticated/${PHOTO_BUCKET}/`,
  ];
  let path = trimmed;
  for (const marker of markers) {
    const index = trimmed.indexOf(marker);
    if (index >= 0) {
      path = decodeURIComponent(trimmed.slice(index + marker.length).split("?")[0] ?? "");
      break;
    }
  }
  path = path.replace(/^\/+/, "");
  if (!path || path.includes("..")) return "";
  return path;
}

export function imageContentType(path: string, fallback?: string) {
  const clean = path.split("?")[0]?.toLowerCase() ?? "";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (fallback?.startsWith("image/")) return fallback;
  return "image/jpeg";
}
