import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { copyFor, type Copy, type Locale } from "@/lib/copy";
import { colors, darkColors, type Palette } from "@/theme";

export type ThemeChoice = "light" | "dark" | "auto";

const STORAGE_KEY = "plant-records-preferences";

type PreferencesValue = {
  locale: Locale;
  theme: ThemeChoice;
  resolved: "light" | "dark";
  palette: Palette;
  avatarUri: string | null;
  t: Copy;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeChoice) => void;
  setAvatarUri: (uri: string | null) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<ThemeChoice>("auto");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { locale?: Locale; theme?: ThemeChoice; avatarUri?: string | null };
        if (saved.locale === "en" || saved.locale === "zh" || saved.locale === "ms") setLocale(saved.locale);
        if (saved.theme === "light" || saved.theme === "dark" || saved.theme === "auto") setTheme(saved.theme);
        if (typeof saved.avatarUri === "string" || saved.avatarUri === null) setAvatarUri(saved.avatarUri ?? null);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, theme, avatarUri })).catch(() => undefined);
  }, [avatarUri, hydrated, locale, theme]);

  const resolved = theme === "auto" ? (system === "dark" ? "dark" : "light") : theme;
  const palette = resolved === "dark" ? darkColors : colors;

  const value = useMemo<PreferencesValue>(
    () => ({
      locale,
      theme,
      resolved,
      palette,
      avatarUri,
      t: copyFor(locale),
      setLocale,
      setTheme,
      setAvatarUri,
    }),
    [avatarUri, locale, palette, resolved, theme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
