import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { useTheme, type TintName } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function Centered({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: t.spacing.xl,
        paddingVertical: t.spacing.xxl,
        gap: t.spacing.md,
      }}
    >
      {children}
    </View>
  );
}

// A large soft disc with a few warm dots around an icon. Purely decorative.
export function StateBadge({ icon, tint }: { icon: IconName; tint: TintName }) {
  const t = useTheme();
  const { bg, fg } = t.tint(tint);
  const dot = (size: number, color: string, style: object) => (
    <View style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
  );
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 148, height: 148, alignItems: "center", justifyContent: "center", marginBottom: t.spacing.sm }}
    >
      <View style={{ width: 128, height: 128, borderRadius: 64, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={56} color={fg} />
      </View>
      {dot(22, t.palette.accent, { top: 8, right: 14 })}
      {dot(12, t.palette.tints.slate.fg, { top: 34, left: 6, opacity: 0.45 })}
      {dot(16, t.palette.primary, { bottom: 10, right: 4, opacity: 0.85 })}
    </View>
  );
}

function Skeleton({ height, width }: { height: number; width?: number | `${number}%` }) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0.8);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <Animated.View
      style={{ height, width, borderRadius: height / 2, backgroundColor: t.palette.surfaceAlt, opacity: pulse }}
    />
  );
}

// Placeholder cards shaped like task rows, so the page doesn't jump when content arrives.
export function LoadingState({ label = "Loading" }: { label?: string }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={{ padding: t.spacing.lg, gap: t.spacing.md }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing.md,
              padding: t.spacing.lg,
              backgroundColor: t.palette.surface,
              borderRadius: t.radius.lg,
            },
            t.shadow.card,
          ]}
        >
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.palette.surfaceAlt }} />
          <View style={{ flex: 1, gap: t.spacing.sm }}>
            <Skeleton height={14} width={i % 2 ? "70%" : "85%"} />
            <Skeleton height={10} width="45%" />
          </View>
        </View>
      ))}
      <Text style={[t.type.caption, { color: t.palette.textMuted, textAlign: "center" }]}>{label}…</Text>
    </View>
  );
}

export function EmptyState({
  icon = "checkmark-done-circle-outline",
  tint = "blue",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  tint?: TintName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = useTheme();
  return (
    <Centered>
      <StateBadge icon={icon} tint={tint} />
      <Text accessibilityRole="header" style={[t.type.heading, { color: t.palette.text, textAlign: "center" }]}>
        {title}
      </Text>
      {message ? (
        <Text style={[t.type.body, { color: t.palette.textMuted, textAlign: "center", maxWidth: 320 }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: t.spacing.sm }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Centered>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTheme();
  return (
    <Centered>
      <StateBadge icon="alert-circle-outline" tint="orange" />
      <Text accessibilityRole="header" style={[t.type.heading, { color: t.palette.text, textAlign: "center" }]}>
        {title}
      </Text>
      <Text style={[t.type.body, { color: t.palette.textMuted, textAlign: "center", maxWidth: 320 }]}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: t.spacing.sm }}>
          <Button label="Try again" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </Centered>
  );
}
