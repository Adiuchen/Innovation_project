import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/theme";

export function HeaderExit({ mode = "field" }: { mode?: "field" | "back" }) {
  function leave() {
    if (mode === "back" && router.canGoBack()) router.back();
    else router.navigate("/field");
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Exit" hitSlop={8} onPress={leave} style={styles.button}>
      <Text style={styles.label}>Exit</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 6, paddingRight: 8 },
  label: { color: colors.forest, fontSize: 16, fontWeight: "700" },
});
