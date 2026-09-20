import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme, type TintName } from "@/theme";

import { IconTile, type IconName } from "./icon-tile";

type Props = {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: IconName;
  tint?: TintName;
  // Content aligned to the right of the title.
  headerRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

// The one surface the app is built from: white, softly rounded, lightly lifted.
export function Card({ children, title, subtitle, icon, tint, headerRight, style }: Props) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.palette.surface,
          borderRadius: t.radius.lg,
          padding: t.spacing.lg,
          gap: t.spacing.lg,
          borderWidth: t.scheme === "dark" ? 1 : 0,
          borderColor: t.palette.border,
        },
        t.shadow.card,
        style,
      ]}
    >
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
          {icon ? <IconTile icon={icon} tint={tint} size={40} /> : null}
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={[t.type.sectionTitle, { color: t.palette.text }]}>
              {title}
            </Text>
            {subtitle ? <Text style={[t.type.caption, { color: t.palette.textMuted }]}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
      ) : null}
      {children}
    </View>
  );
}
