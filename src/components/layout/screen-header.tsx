import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

type Props = {
  title: string;
  subtitle?: string;
  // Round icon buttons on the right.
  actions?: React.ReactNode;
};

// The large title at the top of each tab. Replaces the native header so the page can breathe.
export function ScreenHeader({ title, subtitle, actions }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: t.spacing.md,
        paddingTop: insets.top + t.spacing.sm,
        paddingBottom: t.spacing.lg,
        paddingHorizontal: t.spacing.lg,
        backgroundColor: t.palette.background,
      }}
    >
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={[t.type.label, { color: t.palette.textMuted }]}>{subtitle}</Text> : null}
        <Text accessibilityRole="header" style={[t.type.title, { color: t.palette.text }]}>
          {title}
        </Text>
      </View>
      {actions ? <View style={{ flexDirection: "row", gap: t.spacing.sm }}>{actions}</View> : null}
    </View>
  );
}
