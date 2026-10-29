import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView, type Edges } from "react-native-safe-area-context";
import { colors, statusColors } from "@/theme";
import { statusLabel } from "@/lib/plant";

export function Screen({
  children,
  scroll = true,
  edges = ["bottom"],
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edges;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "ok" | "warn" | "danger" }) {
  return (
    <Text style={[styles.notice, tone === "ok" && styles.noticeOk, tone === "warn" && styles.noticeWarn, tone === "danger" && styles.noticeDanger]}>
      {children}
    </Text>
  );
}

export function Badge({ status }: { status: string }) {
  const palette = statusColors(status);
  return (
    <Text style={[styles.badge, { backgroundColor: palette.background, color: palette.text }]}>{statusLabel(status)}</Text>
  );
}

export function Button({
  label,
  onPress,
  disabled = false,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" && styles.buttonSecondary,
        tone === "danger" && styles.buttonDanger,
        pressed && !disabled && tone === "secondary" && styles.buttonSecondaryPressed,
        pressed && !disabled && tone === "danger" && styles.buttonDangerPressed,
        pressed && !disabled && tone === "primary" && styles.buttonPressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, tone === "secondary" && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType,
  placeholder,
  secure = false,
  autoCapitalize = "sentences",
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  placeholder?: string;
  secure?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        autoCorrect={multiline}
        style={[styles.input, !editable && styles.inputLocked, multiline && styles.area]}
      />
    </View>
  );
}

export function Fact({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <View style={styles.fact}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.forest} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  fill: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: colors.ink },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 8,
  },
  notice: { backgroundColor: colors.infoBg, color: colors.info, borderRadius: 12, padding: 12, overflow: "hidden" },
  noticeOk: { backgroundColor: colors.okBg, color: colors.forest },
  noticeWarn: { backgroundColor: colors.warningBg, color: colors.warning },
  noticeDanger: { backgroundColor: colors.dangerBg, color: colors.danger },
  badge: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: "700" },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  buttonDanger: { backgroundColor: colors.danger },
  buttonPressed: { backgroundColor: colors.forestDark },
  buttonSecondaryPressed: { backgroundColor: colors.okBg, borderColor: colors.forest },
  buttonDangerPressed: { backgroundColor: "#732424" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fffdf8", fontWeight: "700", fontSize: 16 },
  buttonTextSecondary: { color: colors.forest },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 16,
  },
  inputLocked: { backgroundColor: colors.field, color: colors.ink },
  area: { minHeight: 96, textAlignVertical: "top", paddingVertical: 10 },
  fact: { gap: 2 },
  factValue: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.paper },
});
