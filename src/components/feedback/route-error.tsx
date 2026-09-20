import { useRouter } from "expo-router";
import { Pressable, Text, View, useColorScheme } from "react-native";

import { darkPalette, lightPalette } from "@/theme/tokens";

// Error boundaries render when something has already gone wrong, possibly in
// the store or theme themselves, so this file depends on neither. It shows a
// safe message (never the raw error) and offers a way out. It reads the raw
// palette tokens (a plain module) and follows the OS colour scheme directly.

type Props = { error: Error; retry: () => Promise<void> | void };

export function RouteError({ error, retry }: Props) {
  const dark = useColorScheme() === "dark";
  const router = useRouter();
  const p = dark ? darkPalette : lightPalette;
  const c = {
    bg: p.background,
    card: p.surface,
    text: p.text,
    muted: p.textMuted,
    primary: p.primary,
    onPrimary: p.onPrimary,
    tint: p.tints.orange.bg,
    icon: p.tints.orange.fg,
  };

  if (__DEV__) console.warn("[route error]", error);

  const button = (label: string, onPress: () => void, filled: boolean) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 52,
        minWidth: 44,
        paddingHorizontal: 22,
        borderRadius: 18,
        backgroundColor: filled ? c.primary : "transparent",
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: filled ? c.onPrimary : c.primary, fontSize: 16, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={{ backgroundColor: c.card, borderRadius: 28, padding: 28, alignItems: "center", gap: 12, width: "100%", maxWidth: 420 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.tint, alignItems: "center", justifyContent: "center" }}>
          <Text accessibilityElementsHidden style={{ color: c.icon, fontSize: 34, fontWeight: "800" }}>
            !
          </Text>
        </View>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 22, fontWeight: "800", textAlign: "center" }}>
          Something went wrong
        </Text>
        <Text style={{ color: c.muted, fontSize: 16, lineHeight: 24, textAlign: "center" }}>
          This screen ran into a problem. Your tasks are safe on this device.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {button("Try again", () => void retry(), true)}
          {button("Go to Today", () => {
            try {
              router.replace("/");
            } catch {
              void retry();
            }
          }, false)}
        </View>
      </View>
    </View>
  );
}
