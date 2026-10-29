import { Stack } from "expo-router";
import { HeaderExit } from "@/components/HeaderExit";
import { usePreferences } from "@/lib/preferences";
import { headerOptions } from "@/theme";

export default function EventsLayout() {
  const { t } = usePreferences();
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: t.events, headerLeft: () => <HeaderExit /> }} />
      <Stack.Screen name="new" options={{ title: t.addEvent, headerLeft: () => <HeaderExit mode="back" /> }} />
      <Stack.Screen name="[id]" options={{ title: t.editEvent, headerLeft: () => <HeaderExit mode="back" /> }} />
    </Stack>
  );
}
