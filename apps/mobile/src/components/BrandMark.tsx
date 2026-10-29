import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export function BrandMark() {
  return (
    <View style={styles.mark}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 21c0-6 2.5-10 8-13-1 7-4 11-8 13Z"
          stroke="#fffdf8"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path d="M12 21C12 14 9 9 4 6c1.2 6 4.2 10.2 8 15Z" fill="#fffdf8" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1e4d38",
    alignItems: "center",
    justifyContent: "center",
  },
});
