import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { useTheme, type TintName } from "@/theme";

import type { IconName } from "./icon-tile";

type Props = {
  label: string;
  icon?: IconName;
  // A named pastel, or explicit colours. Neutral when neither is given.
  tint?: TintName;
  fg?: string;
  bg?: string;
  // Small coloured dot before the label (a project colour).
  dot?: string;
  maxWidth?: number;
  accessibilityLabel?: string;
};

// A small, static label. Not tappable; use Chip for anything interactive.
export function Pill({ label, icon, tint, fg, bg, dot, maxWidth, accessibilityLabel }: Props) {
  const t = useTheme();
  const tinted = tint ? t.tint(tint) : null;
  const color = fg ?? tinted?.fg ?? t.palette.textMuted;
  const background = bg ?? tinted?.bg ?? t.palette.surfaceAlt;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        maxWidth,
        minHeight: 26,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: t.spacing.sm,
        borderRadius: t.radius.pill,
        backgroundColor: background,
      }}
    >
      {dot ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} /> : null}
      {icon ? <Ionicons name={icon} size={13} color={color} /> : null}
      <Text numberOfLines={1} style={[t.type.small, { color, flexShrink: 1 }]}>
        {label}
      </Text>
    </View>
  );
}
