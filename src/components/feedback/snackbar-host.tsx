import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { useTheme, useThemedStyles, type Theme } from "@/theme";

import { dismissSnackbar, subscribeSnackbar, type SnackbarItem } from "./feedback";

const createStyles = (t: Theme) => ({
  wrap: {
    position: "absolute" as const,
    left: t.spacing.lg,
    right: t.spacing.lg,
  },
  bar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: t.palette.snackbar,
    borderRadius: t.radius.lg - 2,
    paddingLeft: t.spacing.lg,
    minHeight: 56,
    ...t.shadow.raised,
  },
  message: { flex: 1, ...t.type.bodyStrong, color: t.palette.onSnackbar, paddingVertical: t.spacing.md },
  action: {
    minHeight: t.minTouch,
    minWidth: t.minTouch,
    paddingHorizontal: t.spacing.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  actionText: { ...t.type.button, color: t.palette.snackbarAction },
});

// Renders the current snackbar. Mount once, near the root.
export function SnackbarHost({ bottomOffset = 72 }: { bottomOffset?: number }) {
  const [item, setItem] = useState<SnackbarItem | null>(null);
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => subscribeSnackbar(setItem), []);

  useEffect(() => {
    if (!item) return;
    if (reduceMotion) opacity.setValue(1);
    else Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(
      () => dismissSnackbar(item.id),
      item.durationMs ?? (item.actionLabel ? 5000 : 3000),
    );
    return () => {
      clearTimeout(timer);
      opacity.setValue(0);
    };
  }, [item, opacity, reduceMotion]);

  if (!item) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + bottomOffset, opacity }]}
    >
      <View
        style={[
          styles.bar,
          item.tone === "error" && { backgroundColor: theme.palette.danger },
        ]}
        accessibilityLiveRegion="polite"
      >
        <Text style={[styles.message, item.tone === "error" && { color: theme.palette.onPrimary }]}>
          {item.message}
        </Text>
        {item.actionLabel ? (
          <Pressable
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={item.actionLabel}
            onPress={() => {
              dismissSnackbar(item.id);
              item.onAction?.();
            }}
          >
            <Text style={styles.actionText}>{item.actionLabel}</Text>
          </Pressable>
        ) : (
          <View style={{ width: theme.spacing.md }} />
        )}
      </View>
    </Animated.View>
  );
}
