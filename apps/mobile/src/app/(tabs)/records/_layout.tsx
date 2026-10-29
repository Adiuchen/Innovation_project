import { Stack } from "expo-router";
import { HeaderExit } from "@/components/HeaderExit";
import { headerOptions } from "@/theme";

export default function RecordsLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: "My records", headerLeft: () => <HeaderExit /> }} />
      <Stack.Screen name="new" options={{ title: "New record", headerLeft: () => <HeaderExit mode="back" /> }} />
      <Stack.Screen name="[id]" options={{ title: "Plant record", headerLeft: () => <HeaderExit mode="back" /> }} />
      <Stack.Screen name="draft/[id]" options={{ title: "On this phone", headerLeft: () => <HeaderExit mode="back" /> }} />
    </Stack>
  );
}
