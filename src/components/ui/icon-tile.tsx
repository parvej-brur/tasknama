import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { useTheme, type TintName } from "@/theme";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon: IconName;
  tint?: TintName;
  size?: number;
};

// A rounded square with a pastel background and a matching icon. Decorative: the row it sits in carries the label.
export function IconTile({ icon, tint = "blue", size = 44 }: Props) {
  const t = useTheme();
  const { bg, fg } = t.tint(tint);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={fg} />
    </View>
  );
}
