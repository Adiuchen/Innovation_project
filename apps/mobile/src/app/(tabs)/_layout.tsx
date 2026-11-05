import { Tabs } from "expo-router";
import { SyncBar } from "@/components/SyncBar";
import { ScanTabButtonIcon } from "@/components/ScanTabButton";
import { HomeTabIcon, PlantsTabIcon, RecordsTabIcon, SpeciesTabIcon } from "@/components/TabIcon";
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
      // Match unstable_settings.anchor ("field") so Android/system back reaches Home instead of a dead GO_BACK.
      backBehavior="initialRoute"
      screenOptions={{
        // The sync bar sits where a header would, so it handles the top safe area for every tab.
        headerShown: true,
        header: () => <SyncBar />,
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
      <Tabs.Screen
        name="field"
        options={{ title: t.homeTab, tabBarIcon: ({ color, size }) => <HomeTabIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: t.recordsTab, tabBarIcon: ({ color, size }) => <RecordsTabIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="scan"
        // Scan sits in the centre as a raised button. The camera stays full screen, so this tab
        // keeps its own safe area and no sync bar.
        options={{
          title: t.scanTab,
          headerShown: false,
          tabBarAccessibilityLabel: t.scanTab,
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <ScanTabButtonIcon focused={focused} palette={palette} />,
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{ title: t.plantsTab, tabBarIcon: ({ color, size }) => <PlantsTabIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="species"
        options={{ title: t.species, tabBarIcon: ({ color, size }) => <SpeciesTabIcon color={color} size={size} /> }}
      />
      <Tabs.Screen name="events" options={offTabBar} />
    </Tabs>
  );
}
