import { Stack } from "expo-router";
import { headerOptions } from "@/theme";

export default function ScanLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, title: "Scan tag" }} />
      <Stack.Screen name="[code]" options={{ title: "Tagged plant" }} />
    </Stack>
  );
}
