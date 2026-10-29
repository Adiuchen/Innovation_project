import { Stack } from "expo-router";
import { HeaderExit } from "@/components/HeaderExit";
import { usePreferences } from "@/lib/preferences";
import { headerOptions } from "@/theme";

export default function PlantsLayout() {
  const { t } = usePreferences();
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: t.viewPlants, headerLeft: () => <HeaderExit /> }} />
      <Stack.Screen name="[id]" options={{ title: t.viewPlants, headerLeft: () => <HeaderExit mode="back" /> }} />
    </Stack>
  );
}
