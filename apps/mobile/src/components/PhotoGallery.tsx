import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { PlantPhoto } from "@/components/PlantPhoto";
import { isDisplayablePhoto } from "@/lib/photo-path";
import { usePreferences } from "@/lib/preferences";
import type { PhotoRef } from "@/types";

export function PhotoGallery({
  photos,
  height = 220,
  radius = 16,
}: {
  photos: PhotoRef[];
  height?: number;
  radius?: number;
}) {
  const { palette } = usePreferences();
  const visible = photos.filter((photo) => photo.storage_path && isDisplayablePhoto(photo.storage_path));
  const [index, setIndex] = useState(0);
  const active = visible[index] ?? visible[0];
  if (!active) return null;

  return (
    <View style={styles.block}>
      <PlantPhoto photo={active} height={height} radius={radius} />
      {visible.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {visible.map((photo, photoIndex) => {
            const selected = photoIndex === (visible[index] ? index : 0);
            return (
              <Pressable
                key={`${photo.storage_path}-${photoIndex}`}
                accessibilityRole="button"
                onPress={() => setIndex(photoIndex)}
                style={[styles.thumb, selected && { borderColor: palette.forest }]}
              >
                <PlantPhoto photo={photo} showCaption={false} width={72} height={72} radius={12} />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  row: { gap: 10 },
  thumb: { borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
});
