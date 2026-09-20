import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { FieldLabel } from "@/components/ui/field-label";
import { PROJECT_COLOR_IDS, type ProjectColorId } from "@/features/projects/types";
import { PROJECT_COLOR_LABELS, readableOn, useTheme } from "@/theme";

export function ColorPicker({
  value,
  onChange,
}: {
  value: ProjectColorId;
  onChange: (value: ProjectColorId) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.md }}>
      <FieldLabel label="Colour" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.md }}>
        {PROJECT_COLOR_IDS.map((id) => {
          const selected = id === value;
          const color = t.projectColor(id);
          return (
            <Pressable
              key={id}
              onPress={() => onChange(id)}
              accessibilityRole="radio"
              accessibilityLabel={PROJECT_COLOR_LABELS[id]}
              accessibilityState={{ selected }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                padding: 3,
                borderWidth: 3,
                borderColor: selected ? t.palette.text : "transparent",
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 22,
                  backgroundColor: color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selected ? <Ionicons name="checkmark" size={22} color={readableOn(color)} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
