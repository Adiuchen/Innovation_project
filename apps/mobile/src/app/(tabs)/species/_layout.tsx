import { Stack } from "expo-router";
import { HeaderExit } from "@/components/HeaderExit";
import { headerOptions } from "@/theme";

export default function SpeciesLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: "Species guide", headerLeft: () => <HeaderExit /> }} />
      <Stack.Screen name="[id]" options={{ title: "Species", headerLeft: () => <HeaderExit mode="back" /> }} />
    </Stack>
  );
}
