import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon: IconName;
  // Read by screen readers; required because there is no visible text.
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  hint?: string;
  // "soft" sits on a lifted white circle; use it for actions in a screen header.
  variant?: "plain" | "soft";
  // Fill for a "soft" button, instead of the white surface. Its glow follows the fill.
  fill?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 24,
  disabled,
  hint,
  variant = "plain",
  fill,
  style,
}: Props) {
  const t = useTheme();
  const soft = variant === "soft";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: t.minTouch,
          height: t.minTouch,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: t.radius.pill,
          backgroundColor: soft ? (fill ?? t.palette.surface) : "transparent",
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
        soft ? t.shadow.card : null,
        soft && fill && t.scheme === "light" ? { shadowColor: fill, shadowOpacity: 0.35 } : null,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={soft ? 22 : size}
        color={color ?? t.palette.primary}
      />
    </Pressable>
  );
}
