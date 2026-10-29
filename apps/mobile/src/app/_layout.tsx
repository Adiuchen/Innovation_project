import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PreferencesProvider, usePreferences } from "@/lib/preferences";

function ThemedStatus() {
  const { resolved } = usePreferences();
  return <StatusBar style={resolved === "dark" ? "light" : "dark"} />;
}

function RootNavigator() {
  const { ready, profile } = useAuth();
  const { palette } = usePreferences();
  const pathname = usePathname();
  const restored = useRef(false);

  useEffect(() => {
    if (!ready || !profile || restored.current) return;
    if (pathname !== "/" && pathname !== "/login") return;
    restored.current = true;
    router.replace("/field");
  }, [pathname, profile, ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.field, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: palette.forest, fontSize: 18, fontWeight: "700" }}>Opening the field book…</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.field } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tag" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="p/[code]" />
      <Stack.Screen name="e/[id]" />
      <Stack.Screen name="login" />
      <Stack.Protected guard={profile != null}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <AuthProvider>
            <ThemedStatus />
            <RootNavigator />
          </AuthProvider>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
