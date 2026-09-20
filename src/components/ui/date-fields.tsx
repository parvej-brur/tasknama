import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { useTheme } from "@/theme";
import {
  addDays,
  formatDayRelative,
  formatTime,
  parseDateKey,
  parseTimeKey,
  toDateKey,
  toTimeKey,
  type DateKey,
  type TimeKey,
} from "@/utils/date";

import { Button } from "./button";
import { Chip } from "./chip";
import { FieldLabel } from "./field-label";

type PickerProps = {
  label: string;
  mode: "date" | "time";
  value: Date | null;
  display: string | null;
  onPick: (date: Date) => void;
  onClear?: () => void;
  clearLabel: string;
  error?: string | null;
  disabled?: boolean;
  disabledHint?: string;
};

function PickerField({
  label,
  mode,
  value,
  display,
  onPick,
  onClear,
  clearLabel,
  error,
  disabled,
  disabledHint,
}: PickerProps) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  const openPicker = () => {
    const current = value ?? new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        onChange: (event, date) => {
          if (event.type === "set" && date) onPick(date);
        },
      });
    } else {
      setOpen((o) => !o);
    }
  };

  return (
    <View style={{ gap: t.spacing.sm }}>
      <FieldLabel label={label} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.sm }}>
        <Pressable
          onPress={openPicker}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${display ?? "not set"}`}
          accessibilityHint={disabled ? disabledHint : "Opens a picker"}
          accessibilityState={{ disabled: !!disabled }}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            gap: t.spacing.md,
            paddingHorizontal: t.spacing.lg,
            backgroundColor: t.palette.surfaceAlt,
            borderRadius: t.radius.md,
            borderWidth: 2,
            borderColor: error ? t.palette.danger : "transparent",
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          })}
        >
          <Ionicons
            name={mode === "date" ? "calendar-outline" : "time-outline"}
            size={20}
            color={value ? t.palette.primary : t.palette.textMuted}
          />
          <Text style={[t.type.body, { color: display ? t.palette.text : t.palette.textMuted }]}>
            {display ?? (mode === "date" ? "No date" : "No time")}
          </Text>
        </Pressable>
        {value && onClear ? (
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
            style={{ width: t.minTouch, height: t.minTouch, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="close-circle" size={24} color={t.palette.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {open && Platform.OS === "ios" ? (
        <View style={{ backgroundColor: t.palette.surfaceAlt, borderRadius: t.radius.md, padding: t.spacing.sm }}>
          <DateTimePicker
            value={value ?? new Date()}
            mode={mode}
            display={mode === "date" ? "inline" : "spinner"}
            themeVariant={t.scheme}
            accentColor={t.palette.primary}
            onChange={(_event, date) => date && onPick(date)}
          />
          <Button label="Done" variant="ghost" size="sm" onPress={() => setOpen(false)} />
        </View>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={[t.type.caption, { color: t.palette.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function DateField({
  label = "Due date",
  value,
  onChange,
  error,
  today,
  presets = true,
}: {
  label?: string;
  value: DateKey | null;
  onChange: (value: DateKey | null) => void;
  error?: string | null;
  today: DateKey;
  presets?: boolean;
}) {
  const t = useTheme();
  const date = value ? parseDateKey(value) : null;
  return (
    <View style={{ gap: t.spacing.sm }}>
      {presets ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
          <Chip label="Today" selected={value === today} onPress={() => onChange(today)} />
          <Chip label="Tomorrow" selected={value === addDays(today, 1)} onPress={() => onChange(addDays(today, 1))} />
          <Chip label="Next week" selected={value === addDays(today, 7)} onPress={() => onChange(addDays(today, 7))} />
        </View>
      ) : null}
      <PickerField
        label={label}
        mode="date"
        value={date}
        display={value ? formatDayRelative(value, today) : null}
        onPick={(d) => onChange(toDateKey(d))}
        onClear={() => onChange(null)}
        clearLabel={`Clear ${label.toLowerCase()}`}
        error={error}
      />
    </View>
  );
}

export function TimeField({
  label = "Due time",
  value,
  onChange,
  error,
  disabled,
}: {
  label?: string;
  value: TimeKey | null;
  onChange: (value: TimeKey | null) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const date = new Date();
  if (value) {
    const { hours, minutes } = parseTimeKey(value);
    date.setHours(hours, minutes, 0, 0);
  }
  return (
    <PickerField
      label={label}
      mode="time"
      value={value ? date : null}
      display={value ? formatTime(value) : null}
      onPick={(d) => onChange(toTimeKey(d))}
      onClear={() => onChange(null)}
      clearLabel={`Clear ${label.toLowerCase()}`}
      error={error}
      disabled={disabled}
      disabledHint="Set a due date first"
    />
  );
}
