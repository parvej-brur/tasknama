import { View, type StyleProp, type ViewStyle } from "react-native";

import { readableOn, useTheme, type Theme } from "@/theme";

type Props = {
  children: React.ReactNode;
  // Background. Defaults to the deep navy hero colour.
  color?: string;
  // "accent" adds a small warm dot to the rings; "tonal" is rings only (for custom colours).
  decor?: "accent" | "tonal";
  style?: StyleProp<ViewStyle>;
};

// Text and track colours that stay legible on a hero of the given colour.
export function heroInk(t: Theme, color?: string) {
  if (!color) {
    return {
      fg: t.palette.onHero,
      muted: t.palette.onHeroMuted,
      track: t.palette.heroTrack,
      fill: t.palette.accent,
    };
  }
  const fg = readableOn(color);
  const light = fg === "#FFFFFF";
  return {
    fg,
    muted: fg,
    track: light ? "rgba(255, 255, 255, 0.28)" : "rgba(14, 16, 35, 0.16)",
    fill: fg,
  };
}

// The key card at the top of a screen: a deep colour with quiet concentric rings.
export function Hero({ children, color, decor = "accent", style }: Props) {
  const t = useTheme();
  const background = color ?? t.palette.hero;
  const light = readableOn(background) === "#FFFFFF";
  const line = color
    ? light
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(14, 16, 35, 0.14)"
    : t.palette.heroLine;

  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderRadius: t.radius.xl,
          padding: t.spacing.xl,
          gap: t.spacing.md,
          overflow: "hidden",
        },
        t.shadow.raised,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <View style={ring(230, -96, -84, line)} />
        <View style={ring(160, -58, -46, line)} />
        <View style={ring(92, -22, -10, line)} />
        {decor === "accent" ? <View style={dot(12, 34, 74, t.palette.accent)} /> : null}
      </View>
      {children}
    </View>
  );
}

function ring(size: number, top: number, right: number, color: string) {
  return {
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    top,
    right,
    borderWidth: 1.5,
    borderColor: color,
  };
}

function dot(size: number, top: number, right: number, color: string) {
  return {
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    top,
    right,
    backgroundColor: color,
  };
}
