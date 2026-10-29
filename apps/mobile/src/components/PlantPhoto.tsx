import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { usePreferences } from "@/lib/preferences";
import { displayUri } from "@/lib/photos";
import type { PhotoRef } from "@/types";

function isLocalUri(uri: string) {
  return uri.startsWith("file:") || uri.startsWith("content:");
}

type ResolvedPhoto = { path: string; uri: string | null; failed: boolean };

function pendingPhoto(path: string): ResolvedPhoto {
  if (isLocalUri(path)) return { path, uri: path, failed: false };
  return { path, uri: null, failed: false };
}

export function PlantPhoto({
  photo,
  showCaption = true,
  width,
  height = 220,
  radius = 16,
}: {
  photo: PhotoRef;
  showCaption?: boolean;
  width?: number;
  height?: number;
  radius?: number;
}) {
  const { palette } = usePreferences();
  const [resolved, setResolved] = useState<ResolvedPhoto | null>(null);
  const retrying = useRef(false);
  const view = resolved?.path === photo.storage_path ? resolved : pendingPhoto(photo.storage_path);

  useEffect(() => {
    let cancelled = false;
    retrying.current = false;
    displayUri(photo.storage_path)
      .then((next) => {
        if (!cancelled) setResolved({ path: photo.storage_path, uri: next, failed: !next });
      })
      .catch(() => {
        if (!cancelled) setResolved({ path: photo.storage_path, uri: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [photo.storage_path]);

  if (view.failed) return null;

  const caption = showCaption ? photo.caption?.trim() : "";

  const frame = {
    width: width ?? ("100%" as const),
    height,
    borderRadius: radius,
    backgroundColor: palette.sand,
    overflow: "hidden" as const,
  };

  return (
    <View style={[styles.block, width != null && styles.fixed]}>
      {view.uri ? (
        <Image
          key={view.uri}
          source={{ uri: view.uri }}
          style={frame}
          contentFit="cover"
          onError={() => {
            if (isLocalUri(photo.storage_path) || retrying.current) {
              setResolved({ path: photo.storage_path, uri: null, failed: true });
              return;
            }
            retrying.current = true;
            displayUri(photo.storage_path, { refresh: true })
              .then((next) => {
                if (next && next !== view.uri) setResolved({ path: photo.storage_path, uri: next, failed: false });
                else setResolved({ path: photo.storage_path, uri: null, failed: true });
              })
              .catch(() => setResolved({ path: photo.storage_path, uri: null, failed: true }));
          }}
        />
      ) : (
        <View style={[frame, styles.pending]}>
          <ActivityIndicator color={palette.forest} />
        </View>
      )}
      {caption ? <Text style={[styles.caption, { color: palette.muted }]}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 6 },
  fixed: { alignSelf: "flex-start" },
  caption: { fontSize: 15 },
  pending: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
