import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable } from "react-native";

import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { ADD_BUTTON, useTheme } from "@/theme";

const SIZE = 60;

// Floating add button. Tap opens the task form; long press opens quick add.
// Screen readers get the long press as a named custom action.
export function Fab({ projectId }: { projectId?: string }) {
  const t = useTheme();
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue: to, friction: 6, tension: 220, useNativeDriver: true }).start();
  };

  const openForm = () =>
    router.push({ pathname: "/task/new", params: projectId ? { projectId } : {} });
  const openQuickAdd = () => router.push("/quick-add");

  return (
    <Animated.View
      style={{
        position: "absolute",
        right: t.spacing.lg,
        bottom: t.spacing.lg,
        transform: [{ scale }],
      }}
    >
      <Pressable
        onPress={openForm}
        onLongPress={openQuickAdd}
        onPressIn={() => animate(0.92)}
        onPressOut={() => animate(1)}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel="Add task"
        accessibilityHint="Opens the new task form. Long press for quick add."
        accessibilityActions={[{ name: "longpress", label: "Quick add" }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "longpress") openQuickAdd();
        }}
        style={[
          {
            width: SIZE,
            height: SIZE,
            borderRadius: 22,
            backgroundColor: ADD_BUTTON.bg,
            alignItems: "center",
            justifyContent: "center",
          },
          // A warm glow under the marigold rather than the navy card shadow.
          t.shadow.raised,
          t.scheme === "light" ? { shadowColor: ADD_BUTTON.bg, shadowOpacity: 0.4 } : null,
        ]}
      >
        <Ionicons name="add" size={32} color={ADD_BUTTON.fg} />
      </Pressable>
    </Animated.View>
  );
}
