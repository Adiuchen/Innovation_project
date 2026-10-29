export function PhotoList({
  photos,
}: {
  photos: { id: string; storage_path: string; caption: string | null }[];
}) {
  if (photos.length === 0) return null;
  return (
    <ul className="mt-6 space-y-3">
      {photos.map((photo) => (
        <li key={photo.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/photos/${photo.id}`} alt={photo.caption || "Plant"} className="max-h-80 rounded border" />
          {photo.caption && <p className="text-sm text-neutral-600">{photo.caption}</p>}
        </li>
      ))}
    </ul>
  );
}
