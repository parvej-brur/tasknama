import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { useTheme, type TintName } from "@/theme";

import type { IconName } from "./icon-tile";

type Props = {
  label: string;
  value: string;
  caption?: string;
  icon?: IconName;
  tint?: TintName;
  tone?: "default" | "danger";
};

// A pastel number-and-label card. Read as one phrase: "Completed today: 3".
export function StatCard({ label, value, caption, icon, tint = "blue", tone = "default" }: Props) {
  const t = useTheme();
  const danger = tone === "danger";
  const { bg, fg } = t.tint(danger ? "orange" : tint);
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${caption ? `, ${caption}` : ""}`}
      style={{
        flexGrow: 1,
        flexBasis: "45%",
        gap: t.spacing.sm,
        padding: t.spacing.lg,
        backgroundColor: bg,
        borderRadius: t.radius.lg,
      }}
    >
      {icon ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.palette.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={20} color={fg} />
        </View>
      ) : null}
      <Text style={[t.type.display, { color: t.palette.text }]}>{value}</Text>
      <View>
        <Text style={[t.type.label, { color: t.palette.text }]}>{label}</Text>
        {caption ? <Text style={[t.type.caption, { color: t.palette.text, opacity: 0.8 }]}>{caption}</Text> : null}
      </View>
    </View>
  );
}
