import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  // "sm" is for actions that sit beside other content; the tap target stays 44 pt.
  size?: "md" | "sm";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
  style,
}: Props) {
  const t = useTheme();
  const { palette } = t;
  const inactive = disabled || loading;
  const small = size === "sm";

  const colors = {
    // Filled buttons share the deep navy of the hero card, so a screen's key card and its main action match.
    primary: { bg: palette.hero, fg: palette.onHero },
    secondary: { bg: palette.primaryMuted, fg: palette.primary },
    danger: { bg: palette.dangerMuted, fg: palette.danger },
    ghost: { bg: "transparent", fg: palette.primary },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: small ? t.minTouch : 54,
          minWidth: t.minTouch,
          paddingHorizontal: small ? t.spacing.lg : t.spacing.xl,
          borderRadius: small ? t.radius.md : t.radius.lg - 2,
          backgroundColor: colors.bg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: t.spacing.sm,
          opacity: inactive ? 0.5 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
        },
        variant === "primary" && !inactive ? t.shadow.raised : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={small ? 18 : 20} color={colors.fg} />
      ) : null}
      <Text style={[t.type.button, small && { fontSize: 14, lineHeight: 18 }, { color: colors.fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}
