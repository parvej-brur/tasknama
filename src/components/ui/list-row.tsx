import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { useTheme, type TintName } from "@/theme";

import { IconTile, type IconName } from "./icon-tile";

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  // Pastel for the icon tile. Defaults to blue (orange when `tone` is danger).
  tint?: TintName;
  // Coloured dot used instead of an icon (projects).
  dot?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  hint?: string;
  accessibilityLabel?: string;
  tone?: "default" | "danger";
  children?: React.ReactNode;
};

// A tappable card row: icon tile or dot, title, optional subtitle and chevron.
export function ListRow({
  title,
  subtitle,
  icon,
  tint,
  dot,
  onPress,
  trailing,
  hint,
  accessibilityLabel,
  tone = "default",
  children,
}: Props) {
  const t = useTheme();
  const color = tone === "danger" ? t.palette.danger : t.palette.text;
  const content = (pressed: boolean) => (
    <View
      style={[
        {
          minHeight: 68,
          flexDirection: "row",
          alignItems: "center",
          gap: t.spacing.md,
          paddingHorizontal: t.spacing.lg,
          paddingVertical: t.spacing.md,
          backgroundColor: t.palette.surface,
          borderRadius: t.radius.lg,
          borderWidth: t.scheme === "dark" ? 1 : 0,
          borderColor: t.palette.border,
          opacity: pressed ? 0.85 : 1,
        },
        t.shadow.card,
      ]}
    >
      {dot ? (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: t.palette.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: dot }} />
        </View>
      ) : icon ? (
        <IconTile icon={icon} tint={tint ?? (tone === "danger" ? "orange" : "blue")} />
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[t.type.bodyStrong, { color }]}>{title}</Text>
        {subtitle ? <Text style={[t.type.caption, { color: t.palette.textMuted }]}>{subtitle}</Text> : null}
        {children}
      </View>
      {trailing}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={t.palette.textMuted} /> : null}
    </View>
  );

  if (!onPress) return content(false);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      accessibilityHint={hint}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}
