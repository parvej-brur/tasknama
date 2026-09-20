import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/theme";

import type { IconName } from "./icon-tile";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  // Colour of the icon and label while unselected (e.g. a priority colour).
  color?: string;
  accessibilityLabel?: string;
};

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // Names the group for screen readers.
  label: string;
};

// One choice out of two to four short options, always visible.
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        padding: 4,
        gap: 4,
        borderRadius: t.radius.md + 4,
        backgroundColor: t.palette.surfaceAlt,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const fg = selected ? t.palette.onPrimary : (option.color ?? t.palette.textMuted);
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: t.minTouch,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: t.spacing.sm,
              borderRadius: t.radius.md,
              backgroundColor: selected ? t.palette.primary : "transparent",
              opacity: pressed && !selected ? 0.6 : 1,
            })}
          >
            {option.icon ? <Ionicons name={option.icon} size={16} color={fg} /> : null}
            <Text numberOfLines={1} style={[t.type.label, { color: fg }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
