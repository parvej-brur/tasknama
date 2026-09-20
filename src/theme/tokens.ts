import type { ProjectColorId } from "@/features/projects/types";
import type { Priority } from "@/features/tasks/types";

// Colour system: a cobalt-blue primary on cool, navy-tinted neutrals.
//
// Hard rules (enforced by ./contrast.test.ts):
//   - no red, and no green / teal / aqua, anywhere;
//   - every text pair meets WCAG AA (4.5:1).
//
// With red and green off the table, status is carried by hue *and* an icon or
// label, never by colour alone:
//   critical  burnt orange   overdue, destructive actions, errors
//   warning   amber          medium priority, cautions
//   success   plum purple    completed, positive confirmations
//   info/low  slate          low priority, neutral information
// The role names keep their familiar keys (`danger`, `success`, ...) so the
// components read naturally; only the hues differ from the usual convention.

export type TintName = "blue" | "amber" | "orange" | "purple" | "slate";
// A soft background and the stronger colour that stays readable on it.
export type Tint = { bg: string; fg: string };

export type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  // Hairlines and dividers. Not for the edge of a control on its own.
  border: string;
  // Edge of an unchecked control (checkbox ring). At least 3:1 on surface.
  borderStrong: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primaryMuted: string;
  // Critical: overdue, destructive, errors. Burnt orange, never red.
  danger: string;
  dangerMuted: string;
  // Positive / completed. Plum purple, never green.
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  // Marigold. The "+" button, progress fills on the hero and its small
  // decoration. Ink (`onAccent`) on top of it, never white.
  accent: string;
  onAccent: string;
  // Soft marigold for "you are here / today": the active tab, the Today count
  // and due-today labels. Text on it is `highlight.fg`.
  highlight: Tint;
  // Deep, saturated card background for the key card of a screen.
  hero: string;
  onHero: string;
  onHeroMuted: string;
  heroTrack: string;
  // Faint strokes and fills drawn on the hero for decoration.
  heroLine: string;
  overlay: string;
  shadow: string;
  snackbar: string;
  onSnackbar: string;
  snackbarAction: string;
  tints: Record<TintName, Tint>;
};

export const lightPalette: Palette = {
  background: "#F4F6FA",
  surface: "#FFFFFF",
  surfaceAlt: "#EAEEF5",
  border: "#DEE3EC",
  borderStrong: "#7A869E",
  text: "#0F1B33",
  textMuted: "#4A5872",
  primary: "#2557D6",
  onPrimary: "#FFFFFF",
  primaryMuted: "#E4EBFC",
  danger: "#A34C00",
  dangerMuted: "#FFE9D3",
  success: "#7A32A6",
  successMuted: "#F0E6FA",
  warning: "#7F5A00",
  warningMuted: "#FFF1C2",
  accent: "#F2A900",
  onAccent: "#1B1400",
  highlight: { bg: "#FFF1CC", fg: "#8A5A00" },
  hero: "#1B3A8F",
  onHero: "#FFFFFF",
  onHeroMuted: "#C8D6F7",
  heroTrack: "rgba(255, 255, 255, 0.22)",
  heroLine: "rgba(255, 255, 255, 0.16)",
  overlay: "rgba(11, 17, 32, 0.45)",
  shadow: "#14265A",
  snackbar: "#14203D",
  onSnackbar: "#FFFFFF",
  snackbarAction: "#A9C4FF",
  tints: {
    blue: { bg: "#E4EBFC", fg: "#1F4BC0" },
    amber: { bg: "#FFF1C2", fg: "#7A5600" },
    orange: { bg: "#FFE9D3", fg: "#9C4A00" },
    purple: { bg: "#F0E6FA", fg: "#6B2F9B" },
    slate: { bg: "#E8ECF3", fg: "#34435E" },
  },
};

export const darkPalette: Palette = {
  background: "#0A101F",
  surface: "#121A2E",
  surfaceAlt: "#1A2440",
  border: "#25304C",
  borderStrong: "#7383A6",
  text: "#EAF0FF",
  textMuted: "#9FADCA",
  primary: "#7CA6FF",
  onPrimary: "#0A1533",
  primaryMuted: "#1B2B58",
  danger: "#FFA45E",
  dangerMuted: "#3A2410",
  success: "#C9A6F5",
  successMuted: "#2C1F42",
  warning: "#F2C14E",
  warningMuted: "#382C0E",
  accent: "#F5B324",
  onAccent: "#1B1400",
  highlight: { bg: "#3A2F12", fg: "#F5B324" },
  hero: "#1C378C",
  onHero: "#FFFFFF",
  onHeroMuted: "#CBD7F7",
  heroTrack: "rgba(255, 255, 255, 0.2)",
  heroLine: "rgba(255, 255, 255, 0.14)",
  overlay: "rgba(0, 0, 0, 0.6)",
  shadow: "#000000",
  snackbar: "#EAF0FF",
  onSnackbar: "#0A101F",
  snackbarAction: "#1F4BC0",
  tints: {
    blue: { bg: "#1B2B58", fg: "#A9C4FF" },
    amber: { bg: "#382C0E", fg: "#F2C14E" },
    orange: { bg: "#3A2410", fg: "#FFA45E" },
    purple: { bg: "#2C1F42", fg: "#CBA9F5" },
    slate: { bg: "#1F2A44", fg: "#B7C3DD" },
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
// Minimum touch target on both axes.
export const MIN_TOUCH = 44;

// The "add" buttons (floating "+" and the header's quick add): marigold with a white glyph, in light and dark alike.
export const ADD_BUTTON = { bg: "#F2A900", fg: "#FFFFFF" } as const;

export const fonts = {
  heading: "PlusJakartaSans_700Bold",
  headingBold: "PlusJakartaSans_800ExtraBold",
  body: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemiBold: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
} as const;

// Sizes scale with the user's text size setting (allowFontScaling is on).
export const type = {
  display: { fontFamily: fonts.headingBold, fontSize: 32, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontFamily: fonts.headingBold, fontSize: 26, lineHeight: 34, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  subheading: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 20 },
} as const;

// Soft, blue-tinted elevation. Dark mode leans on surface colour instead.
export function makeShadows(palette: Palette, scheme: "light" | "dark") {
  const dark = scheme === "dark";
  return {
    none: {},
    card: {
      shadowColor: palette.shadow,
      shadowOpacity: dark ? 0 : 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: dark ? 0 : 2,
    },
    raised: {
      shadowColor: palette.shadow,
      shadowOpacity: dark ? 0.5 : 0.28,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  } as const;
}

// The ids are stored in users' data and backups, so they stay as they were. The
// colours behind them are the new palette's, and the human names below are what
// screen readers announce (the ids no longer describe the colour).
export const PROJECT_SWATCHES: Record<ProjectColorId, { light: string; dark: string }> = {
  teal: { light: "#2557D6", dark: "#7CA6FF" }, // Blue
  indigo: { light: "#243047", dark: "#C5D0E6" }, // Ink
  amber: { light: "#9A5B00", dark: "#F2C14E" }, // Amber
  green: { light: "#B85300", dark: "#FFA45E" }, // Orange
  rose: { light: "#A02A94", dark: "#E58AD8" }, // Magenta
  violet: { light: "#6B34A0", dark: "#C9A6F5" }, // Purple
};

export const PROJECT_COLOR_LABELS: Record<ProjectColorId, string> = {
  teal: "Blue",
  indigo: "Ink",
  amber: "Amber",
  green: "Orange",
  rose: "Magenta",
  violet: "Purple",
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; icon: "chevron-up-circle" | "remove-circle" | "chevron-down-circle" }
> = {
  high: { label: "High", icon: "chevron-up-circle" },
  medium: { label: "Medium", icon: "remove-circle" },
  low: { label: "Low", icon: "chevron-down-circle" },
};

export function priorityColor(priority: Priority, palette: Palette): string {
  return priority === "high"
    ? palette.danger
    : priority === "medium"
      ? palette.warning
      : palette.tints.slate.fg;
}

// Soft background for a priority label; pairs with `priorityColor`.
export function priorityTint(priority: Priority, palette: Palette): string {
  return priority === "high"
    ? palette.dangerMuted
    : priority === "medium"
      ? palette.warningMuted
      : palette.tints.slate.bg;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// White or near-black ink, whichever reads better on `background` (a #RRGGBB colour).
export function readableOn(background: string): string {
  const L = luminance(background);
  const white = 1.05 / (L + 0.05);
  const ink = (L + 0.05) / (luminance("#0E1023") + 0.05);
  return white >= ink ? "#FFFFFF" : "#0E1023";
}
