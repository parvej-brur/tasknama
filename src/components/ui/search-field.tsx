import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder = "Search tasks" }: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        {
          flex: 1,
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: t.spacing.lg,
          backgroundColor: t.palette.surface,
          borderRadius: t.radius.lg - 2,
          borderWidth: 2,
          borderColor: focused ? t.palette.primary : "transparent",
        },
        t.shadow.card,
      ]}
    >
      <Ionicons name="search" size={20} color={focused ? t.palette.primary : t.palette.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.palette.textMuted}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[t.type.body, { flex: 1, minHeight: 48, paddingHorizontal: t.spacing.md, color: t.palette.text }]}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={{ width: t.minTouch, height: t.minTouch, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="close-circle" size={20} color={t.palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
