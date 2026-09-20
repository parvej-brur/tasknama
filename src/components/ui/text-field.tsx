import { forwardRef, useEffect, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { announce } from "@/components/feedback/feedback";
import { useTheme } from "@/theme";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  // Shows "12/200" under the field.
  maxLength?: number;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, hint, maxLength, value, multiline, style, onFocus, onBlur, ...rest },
  ref,
) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  // Errors are announced as they appear, so they aren't only visual.
  useEffect(() => {
    if (error) announce(`${label}: ${error}`);
  }, [error, label]);

  const showFooter = !!error || (maxLength !== undefined && typeof value === "string");

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text style={[t.type.label, { color: t.palette.text }]}>{label}</Text>
      <TextInput
        ref={ref}
        value={value}
        multiline={multiline}
        maxLength={maxLength === undefined ? undefined : maxLength + 50}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={t.palette.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          t.type.body,
          {
            minHeight: multiline ? 112 : 52,
            paddingHorizontal: t.spacing.lg,
            paddingVertical: multiline ? t.spacing.md : t.spacing.sm,
            textAlignVertical: multiline ? "top" : "center",
            color: t.palette.text,
            backgroundColor: focused ? t.palette.surface : t.palette.surfaceAlt,
            borderRadius: t.radius.md,
            borderWidth: 2,
            borderColor: error ? t.palette.danger : focused ? t.palette.primary : "transparent",
          },
          style,
        ]}
        {...rest}
      />
      {hint && !error ? <Text style={[t.type.caption, { color: t.palette.textMuted }]}>{hint}</Text> : null}
      {showFooter ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: t.spacing.md }}>
          {error ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[t.type.caption, { color: t.palette.danger, flex: 1 }]}
            >
              {error}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {maxLength !== undefined && typeof value === "string" ? (
            <Text
              importantForAccessibility="no"
              style={[
                t.type.caption,
                { color: value.length > maxLength ? t.palette.danger : t.palette.textMuted },
              ]}
            >
              {value.length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});
