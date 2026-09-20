import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";

import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { useTheme } from "@/theme";

type Props = {
  checked: boolean;
  onToggle: () => void;
  // e.g. "Buy milk" → announced as "Buy milk, checkbox, checked".
  label: string;
  size?: number;
  // Colour of the unchecked ring. Defaults to the neutral control edge.
  ringColor?: string;
};

// A round check control with a 44 pt hit area.
export function Checkbox({ checked, onToggle, label, size = 26, ringColor }: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  // A small spring when the box fills, so completing a task feels acknowledged.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion || !checked) return;
    pop.setValue(0.8);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  }, [checked, reduceMotion, pop]);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={{ width: t.minTouch, height: t.minTouch, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: checked ? 0 : 2,
          borderColor: ringColor ?? t.palette.borderStrong,
          backgroundColor: checked ? t.palette.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: pop }],
        }}
      >
        {checked ? <Ionicons name="checkmark" size={size * 0.66} color={t.palette.onPrimary} /> : null}
      </Animated.View>
    </Pressable>
  );
}
