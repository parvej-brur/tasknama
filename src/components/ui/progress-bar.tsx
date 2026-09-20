import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { useTheme } from "@/theme";

type Props = {
  done: number;
  total: number;
  color?: string;
  // Override the track (e.g. on a hero card).
  trackColor?: string;
  height?: number;
  label: string;
};

// Rounded progress bar. Reads as "label: 2 of 5" to screen readers.
export function ProgressBar({ done, total, color, trackColor, height = 10, label }: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const ratio = total === 0 ? 0 : Math.min(1, done / total);
  const width = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    if (reduceMotion) width.setValue(ratio);
    else Animated.timing(width, { toValue: ratio, duration: 350, useNativeDriver: false }).start();
  }, [ratio, reduceMotion, width]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${done} of ${total}`}
      accessibilityValue={{ min: 0, max: Math.max(total, 1), now: done }}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor ?? t.palette.surfaceAlt,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: color ?? t.palette.primary,
          width: width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}
