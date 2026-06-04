import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";

const THEME_STORAGE_KEY = "store_theme_preference";

export type ThemePreference = "system" | "light" | "dark";

type ThemePreferenceContextType = {
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  setPreference: (value: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<
  ThemePreferenceContextType | undefined
>(undefined);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme() ?? "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "system" || saved === "light" || saved === "dark") {
          setPreferenceState(saved);
        }
      } catch {
        // Ignore storage issues and fall back to system preference.
      }
    };
    void loadPreference();
  }, []);

  const setPreference = (value: ThemePreference) => {
    setPreferenceState(value);
    void (async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, value);
      } catch {
        // Ignore storage issues and keep in-memory preference.
      }
    })();
  };

  const resolvedTheme: "light" | "dark" =
    preference === "system" ? systemTheme : preference;

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, systemTheme],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference must be used inside ThemePreferenceProvider",
    );
  }
  return context;
}
