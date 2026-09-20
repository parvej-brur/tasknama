import { Text, View } from "react-native";

import { useTheme } from "@/theme";

// The label above a form control. `hint` is persistent helper text beneath it.
export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={[t.type.label, { color: t.palette.text }]}>{label}</Text>
      {hint ? <Text style={[t.type.caption, { color: t.palette.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}
