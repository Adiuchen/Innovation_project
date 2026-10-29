import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Field, Notice, Screen, Title } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors } from "@/theme";

export default function LoginScreen() {
  const { profile, signIn, bootMessage } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) router.replace("/field");
  }, [profile]);

  async function submit() {
    setBusy(true);
    setError(null);
    const message = await signIn(loginId, password);
    setBusy(false);
    if (message) setError(message);
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
        <Text style={styles.back}>Back</Text>
      </Pressable>
      <View style={styles.mark}>
        <Text style={styles.markText}>Niah</Text>
      </View>
      <Title>Plant Records</Title>
      <Text style={styles.intro}>
        Sign in with the staff ID issued by an administrator. The app then loads your profile and allows access only while the account is active.
      </Text>
      {bootMessage && <Notice tone="warn">{bootMessage}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="Staff ID" value={loginId} onChangeText={setLoginId} placeholder="B001" autoCapitalize="none" />
      <Field label="Password" value={password} onChangeText={setPassword} secure autoCapitalize="none" />
      <Button label={busy ? "Signing in…" : "Sign in"} disabled={busy || !loginId.trim() || !password} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.forest, fontWeight: "700", fontSize: 16 },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: colors.sand, fontWeight: "700" },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 22 },
});
