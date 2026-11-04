import { StyleSheet, View } from "react-native";
import { ScanTabIcon } from "@/components/TabIcon";
import type { Palette } from "@/theme";

// The main field action: a raised round button in the centre of the tab bar.
export function ScanTabButtonIcon({ focused, palette }: { focused: boolean; palette: Palette }) {
  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: focused ? palette.forestDark : palette.forest, borderColor: palette.tab },
      ]}
    >
      <ScanTabIcon color="#ffffff" size={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
