import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  // Adds a trailing ✕ that calls this instead.
  onRemove?: () => void;
  removeLabel?: string;
  icon?: IconName;
  // Small coloured dot before the label (e.g. a project colour).
  dot?: string;
  color?: string;
  badge?: string;
  accessibilityLabel?: string;
};

// A pill that can act as a filter toggle, a removable token, or plain info.
export function Chip({
  label,
  selected,
  onPress,
  onRemove,
  removeLabel,
  icon,
  dot,
  color,
  badge,
  accessibilityLabel,
}: Props) {
  const t = useTheme();
  const p = t.palette;
  const fg = selected ? p.onPrimary : (color ?? p.text);
  const interactive = !!onPress;

  const body = (
    <View
      style={{
        minHeight: 40,
        flexDirection: "row",
        alignItems: "center",
        gap: t.spacing.xs + 2,
        paddingHorizontal: t.spacing.md + 2,
        borderRadius: t.radius.pill,
        backgroundColor: selected ? p.primary : p.surfaceAlt,
      }}
    >
      {dot ? (
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot }} />
      ) : null}
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text style={[t.type.label, { color: fg, flexShrink: 1 }]}>{label}</Text>
      {badge ? (
        <Text
          style={[
            t.type.small,
            {
              color: p.primary,
              backgroundColor: p.primaryMuted,
              borderRadius: t.radius.sm,
              paddingHorizontal: 6,
              overflow: "hidden",
            },
          ]}
        >
          {badge}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center", maxWidth: "100%" }}>
      {interactive ? (
        <Pressable
          onPress={onPress}
          hitSlop={{ top: 2, bottom: 2 }}
          accessibilityRole={selected === undefined ? "button" : "checkbox"}
          accessibilityState={selected === undefined ? undefined : { checked: selected }}
          accessibilityLabel={accessibilityLabel ?? label}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexShrink: 1 })}
        >
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={accessibilityLabel ?? (badge ? `${label}, ${badge}` : label)}>
          {body}
        </View>
      )}
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={removeLabel ?? `Remove ${label}`}
          style={{ width: t.minTouch, height: t.minTouch, alignItems: "center", justifyContent: "center", marginLeft: -t.spacing.sm }}
        >
          <Ionicons name="close-circle" size={22} color={p.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
