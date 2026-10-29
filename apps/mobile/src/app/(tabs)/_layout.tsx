import { Tabs } from "expo-router";
import { usePreferences } from "@/lib/preferences";

export const unstable_settings = {
  anchor: "field",
};

// Keep these routes in the tab navigator, but do not mark them `href: null`.
// In SDK 58 that flag hides the screen and immediately sends the user back to Field.
const offTabBar = {
  tabBarButton: () => null,
  tabBarItemStyle: { display: "none" as const, width: 0, maxWidth: 0, height: 0, flex: 0, overflow: "hidden" as const },
};

export default function TabLayout() {
  const { palette, t } = usePreferences();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.forest,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.tab,
          borderTopColor: "transparent",
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="field" options={{ title: t.field }} />
      <Tabs.Screen name="records" options={{ title: t.recordsTab }} />
      <Tabs.Screen name="species" options={{ title: t.speciesTab }} />
      <Tabs.Screen name="scan" options={{ title: t.scanTab }} />
      <Tabs.Screen name="events" options={offTabBar} />
      <Tabs.Screen name="plants" options={offTabBar} />
    </Tabs>
  );
}
