import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import type { ProjectColorId } from "@/features/projects/types";
import { useAppSelector } from "@/lib/store/hooks";

import {
  MIN_TOUCH,
  PROJECT_SWATCHES,
  darkPalette,
  fonts,
  lightPalette,
  makeShadows,
  radius,
  spacing,
  type,
  type Palette,
  type Tint,
  type TintName,
} from "./tokens";

export * from "./tokens";

export type Theme = {
  scheme: "light" | "dark";
  palette: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof type;
  fonts: typeof fonts;
  shadow: ReturnType<typeof makeShadows>;
  minTouch: number;
  projectColor: (id: ProjectColorId) => string;
  tint: (name: TintName) => Tint;
};

const themes: Record<"light" | "dark", Theme> = {
  light: makeTheme("light", lightPalette),
  dark: makeTheme("dark", darkPalette),
};

function makeTheme(scheme: "light" | "dark", palette: Palette): Theme {
  return {
    scheme,
    palette,
    spacing,
    radius,
    type,
    fonts,
    shadow: makeShadows(palette, scheme),
    minTouch: MIN_TOUCH,
    projectColor: (id) => PROJECT_SWATCHES[id]?.[scheme] ?? palette.primary,
    tint: (name) => palette.tints[name],
  };
}

// Resolves the theme from the user's setting (system / light / dark).
export function useTheme(): Theme {
  const mode = useAppSelector((state) => state.settings.theme);
  const system = useColorScheme();
  const scheme = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
  return themes[scheme];
}

// Builds a StyleSheet once per theme change.
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- factories are module-level
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
