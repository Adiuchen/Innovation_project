import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { SyncBar } from "@/components/SyncBar";
import { ScanTabButtonIcon } from "@/components/ScanTabButton";
import { HomeTabIcon, PlantsTabIcon, RecordsTabIcon, SpeciesTabIcon, TabSlot } from "@/components/TabIcon";
import { useAuth } from "@/lib/auth";
import { listRecords } from "@/lib/db";
import { listOpenPlantUpdates } from "@/lib/plant-updates";
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
  const { profile, version, pending, online, syncing } = useAuth();
  const [attention, setAttention] = useState(0);

  useEffect(() => {
    if (profile?.role !== "botanist") {
      setAttention(0);
      return;
    }
    let cancelled = false;
    Promise.all([listRecords(profile.uuid), listOpenPlantUpdates(profile.uuid)])
      .then(([records, updates]) => {
        if (cancelled) return;
        const waiting = records.filter((item) => item.status === "needs_revision" || item.status === "rejected").length;
        setAttention(waiting + updates.rows.length);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pending, profile, version]);

  return (
    <Tabs
      // Match unstable_settings.anchor ("field") so Android/system back reaches Home instead of a dead GO_BACK.
      backBehavior="initialRoute"
      screenOptions={{
        // A healthy sync needs no banner. The bar only appears when the phone is offline,
        // a sync is running, or records are waiting, and then it owns the top safe area.
        headerShown: syncing || !online || pending > 0,
        header: () => <SyncBar />,
        tabBarActiveTintColor: palette.forest,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.tab,
          borderTopColor: "transparent",
          elevation: 0,
        },
        tabBarLabel: ({ focused, color, children }) => (
          <Text style={{ color, fontSize: 12, fontWeight: focused ? "700" : "500" }}>{children}</Text>
        ),
      }}
    >
      <Tabs.Screen
        name="field"
        options={{
          title: t.homeTab,
          tabBarIcon: ({ color, size, focused }) => (
            <TabSlot focused={focused} background={palette.okBg}>
              <HomeTabIcon color={color} size={size} filled={focused} />
            </TabSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            // A scan or a recent plant leaves its detail on this stack. The tab itself is the list.
            event.preventDefault();
            navigation.navigate("records", { screen: "index" });
          },
        })}
        options={{
          title: t.recordsTab,
          tabBarIcon: ({ color, size, focused }) => (
            <TabSlot focused={focused} background={palette.okBg}>
              <RecordsTabIcon color={color} size={size} filled={focused} />
            </TabSlot>
          ),
          tabBarBadge: attention > 0 ? attention : undefined,
          tabBarBadgeStyle: { backgroundColor: "#dc2626", color: "#fff" },
        }}
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
        options={{
          title: t.plantsTab,
          tabBarIcon: ({ color, size, focused }) => (
            <TabSlot focused={focused} background={palette.okBg}>
              <PlantsTabIcon color={color} size={size} filled={focused} />
            </TabSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="species"
        options={{
          title: t.species,
          tabBarIcon: ({ color, size, focused }) => (
            <TabSlot focused={focused} background={palette.okBg}>
              <SpeciesTabIcon color={color} size={size} filled={focused} />
            </TabSlot>
          ),
        }}
      />
      <Tabs.Screen name="events" options={offTabBar} />
    </Tabs>
  );
}
