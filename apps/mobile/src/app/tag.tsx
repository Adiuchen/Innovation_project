import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { InputAccessoryView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { parsePlantCode } from "@/lib/plant";
import { useKeyboardHeight } from "@/lib/useKeyboardHeight";
import { colors } from "@/theme";

export default function GuestScanScreen() {
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState("");
  const locked = useRef(false);
  const keyboardHeight = useKeyboardHeight();

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );

  function openCode(raw: string) {
    const code = parsePlantCode(raw);
    if (!code || locked.current) return;
    locked.current = true;
    router.push({ pathname: "/p/[code]", params: { code } });
  }

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (!permission) return <View style={styles.empty} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.permission, { paddingBottom: 16 + keyboardHeight }]} edges={keyboardHeight > 0 ? ["top"] : ["top", "bottom"]}>
        <ExitButton onPress={leave} light />
        <Text style={styles.title}>Scan a plant tag</Text>
        <Text style={styles.body}>The camera reads the QR code and opens the public plant page. No login is required.</Text>
        <Button label="Allow camera" onPress={requestPermission} />
        <ManualEntry accessoryId="guest-tag-code" value={manual} onChange={setManual} onOpen={openCode} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fill}>
      <View style={styles.camera}>
        {focused ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => openCode(data)}
          />
        ) : null}
        <View style={styles.frame} pointerEvents="none" />
        <Pressable accessibilityRole="button" style={styles.torch} onPress={() => setTorch((value) => !value)}>
          <Text style={styles.torchText}>{torch ? "Torch on" : "Torch off"}</Text>
        </Pressable>
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Text style={styles.overlayTitle}>Point at a plant tag</Text>
        <ExitButton onPress={leave} />
        <ManualEntry accessoryId="guest-tag-code" value={manual} onChange={setManual} onOpen={openCode} />
      </SafeAreaView>
    </View>
  );
}

function ExitButton({ onPress, light = false }: { onPress: () => void; light?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Exit scan" style={[styles.exit, light && styles.exitLight]} onPress={onPress}>
      <Text style={[styles.exitText, light && styles.exitTextLight]}>Exit</Text>
    </Pressable>
  );
}

function ManualEntry({
  accessoryId,
  value,
  onChange,
  onOpen,
}: {
  accessoryId: string;
  value: string;
  onChange: (value: string) => void;
  onOpen: (value: string) => void;
}) {
  const field = (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Or type the tag code"
      placeholderTextColor={colors.muted}
      autoCapitalize="none"
      autoCorrect={false}
      style={styles.input}
    />
  );

  return (
    <View style={styles.manual}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Or type the tag code"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        inputAccessoryViewID={Platform.OS === "ios" ? accessoryId : undefined}
        style={styles.input}
      />
      <Button label="Open tag" tone="secondary" disabled={!value.trim()} onPress={() => onOpen(value)} />
      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={accessoryId} backgroundColor="#f4f1ea">
          <View style={styles.accessory}>
            {field}
            <Button label="Open tag" tone="secondary" disabled={!value.trim()} onPress={() => onOpen(value)} />
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  empty: { flex: 1, backgroundColor: "#e7f0e4" },
  permission: { flex: 1, backgroundColor: "#e7f0e4", padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: colors.ink, marginTop: 12 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  camera: { flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center" },
  footer: { backgroundColor: "#111", paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  exit: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  exitLight: { alignSelf: "flex-start", minHeight: 40, backgroundColor: colors.forest, borderRadius: 999, paddingHorizontal: 16 },
  exitText: { color: "#111", fontWeight: "700", fontSize: 16 },
  exitTextLight: { color: "#fffdf8" },
  overlayTitle: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  torch: {
    position: "absolute",
    bottom: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  torchText: { color: "#fff", fontWeight: "700" },
  manual: { gap: 8, backgroundColor: colors.card, borderRadius: 16, padding: 12 },
  accessory: {
    gap: 8,
    backgroundColor: "#f4f1ea",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: colors.ink,
  },
});
