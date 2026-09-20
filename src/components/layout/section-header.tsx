import { Text, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  title: string;
  count?: number;
  tone?: "default" | "danger" | "highlight";
  action?: React.ReactNode;
};

// A section title with an optional count badge and a trailing action. Has no side padding; the parent sets the gutter.
export function SectionHeader({ title, count, tone = "default", action }: Props) {
  const t = useTheme();
  const danger = tone === "danger";
  const badge =
    tone === "danger"
      ? { bg: t.palette.dangerMuted, fg: t.palette.danger }
      : tone === "highlight"
        ? t.palette.highlight
        : { bg: t.palette.primaryMuted, fg: t.palette.primary };
  return (
    <View
      style={{
        minHeight: t.minTouch,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: t.spacing.md,
      }}
    >
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={count === undefined ? title : `${title}, ${count}`}
        style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.sm }}
      >
        <Text style={[t.type.sectionTitle, { color: danger ? t.palette.danger : t.palette.text }]}>{title}</Text>
        {count !== undefined ? (
          <View
            style={{
              minWidth: 24,
              height: 22,
              paddingHorizontal: 7,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: badge.bg,
            }}
          >
            <Text style={[t.type.small, { color: badge.fg }]}>{count}</Text>
          </View>
        ) : null}
      </View>
      {action}
    </View>
  );
}
