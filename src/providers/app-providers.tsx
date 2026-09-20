import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, type ReactNode } from "react";
import { Appearance, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";

import { showSnackbar } from "@/components/feedback/feedback";
import { reconcileFocus } from "@/features/focus";
import { startReminderSync } from "@/features/notifications";
import { subscribeStorageErrors } from "@/lib/storage/errors";
import { hydrationSkipped, store } from "@/lib/store";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

SplashScreen.preventAutoHideAsync();

// App-wide side effects that have to run once, inside the store provider.
function AppLifecycle() {
  const mode = useAppSelector((s) => s.settings.theme);

  // Make the OS (pickers, alerts, keyboard) follow the in-app theme choice.
  useEffect(() => {
    Appearance.setColorScheme(mode === "system" ? null : mode);
  }, [mode]);

  // Storage problems surface as a snackbar, never a crash.
  useEffect(() => {
    const stop = subscribeStorageErrors((message) =>
      showSnackbar({ message, tone: "error", durationMs: 6000 }),
    );
    if (hydrationSkipped > 0) {
      showSnackbar({ message: "Some saved data couldn’t be read and was skipped.", tone: "error", durationMs: 6000 });
    }
    return stop;
  }, []);

  // Keep scheduled reminders in step with tasks, and settle a focus session
  // that ended while the app was closed.
  useEffect(() => {
    const stopReminders = startReminderSync(store);
    store.dispatch(reconcileFocus());
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") store.dispatch(reconcileFocus());
    });
    return () => {
      stopReminders();
      appState.remove();
    };
  }, []);

  return null;
}

// Feeds the app's palette to React Navigation (headers, tab bar, backgrounds).
function ThemedNavigation({ children }: { children: ReactNode }) {
  const t = useTheme();
  const base = t.scheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: t.palette.primary,
      background: t.palette.background,
      card: t.palette.surface,
      text: t.palette.text,
      border: t.palette.border,
    },
  };
  return <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>;
}

// Everything the route tree needs above it: fonts, gestures, safe areas, the
// store, navigation theming and app-wide effects.
export function AppProviders({ children }: { children: ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <ThemedNavigation>
            <AppLifecycle />
            {children}
          </ThemedNavigation>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
