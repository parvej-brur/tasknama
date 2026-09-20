import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DateField, TimeField } from "@/components/ui/date-fields";
import { FieldLabel } from "@/components/ui/field-label";
import { useNotificationPermission } from "@/features/notifications/hooks/use-notification-permission";
import { openNotificationSettings } from "@/features/notifications/notifications";
import { PRESET_LABELS } from "@/features/notifications/reminder-planner";
import {
  REMINDER_PRESETS,
  type Reminder,
  type ReminderPreset,
} from "@/features/notifications/types";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";
import { dateKeyOfInstant, parseDateKey, toTimeKey, type DateKey } from "@/utils/date";

type Props = {
  value: Reminder | null;
  onChange: (value: Reminder | null) => void;
  hasDueDate: boolean;
  today: DateKey;
  error?: string | null;
};

// Combines a date key and time key into a local instant.
function compose(date: DateKey, time: string): string {
  const day = parseDateKey(date) ?? new Date();
  const [h, m] = time.split(":").map(Number);
  day.setHours(h || 0, m || 0, 0, 0);
  return day.toISOString();
}

export function ReminderField({ value, onChange, hasDueDate, today, error }: Props) {
  const t = useTheme();
  const defaultPreset = useAppSelector((s) => s.settings.defaultReminder);
  const permission = useNotificationPermission();
  const [customDate, setCustomDate] = useState<DateKey | null>(
    value?.kind === "custom" ? dateKeyOfInstant(value.at) : null,
  );
  const [customTime, setCustomTime] = useState<string | null>(
    value?.kind === "custom" ? toTimeKey(new Date(value.at)) : null,
  );

  // Permission is requested the first time a reminder is chosen, never on launch.
  const choose = (next: Reminder | null) => {
    onChange(next);
    if (next) void permission.request();
  };

  const selectCustom = () => {
    const date = customDate ?? today;
    const time = customTime ?? "09:00";
    setCustomDate(date);
    setCustomTime(time);
    choose({ kind: "custom", at: compose(date, time) });
  };

  const updateCustom = (date: DateKey | null, time: string | null) => {
    setCustomDate(date);
    setCustomTime(time);
    if (date && time) onChange({ kind: "custom", at: compose(date, time) });
  };

  return (
    <View style={{ gap: t.spacing.sm }}>
      <FieldLabel label="Reminder" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
        <Chip label="None" selected={value === null} onPress={() => onChange(null)} />
        {hasDueDate
          ? REMINDER_PRESETS.map((preset: ReminderPreset) => (
              <Chip
                key={preset}
                label={PRESET_LABELS[preset]}
                selected={value?.kind === "preset" && value.preset === preset}
                badge={preset === defaultPreset ? "default" : undefined}
                onPress={() => choose({ kind: "preset", preset })}
              />
            ))
          : null}
        <Chip label="Custom" selected={value?.kind === "custom"} onPress={selectCustom} />
      </View>

      {!hasDueDate ? (
        <Text style={[t.type.caption, { color: t.palette.textMuted }]}>
          Add a due date to use reminders like “{PRESET_LABELS[defaultPreset].toLowerCase()}”, or choose Custom.
        </Text>
      ) : null}

      {value?.kind === "custom" ? (
        <View style={{ gap: t.spacing.sm }}>
          <DateField
            label="Reminder date"
            value={customDate}
            onChange={(d) => updateCustom(d, customTime)}
            today={today}
            presets={false}
          />
          <TimeField label="Reminder time" value={customTime} onChange={(v) => updateCustom(customDate, v)} />
        </View>
      ) : null}

      {value && permission.state === "denied" ? (
        <View
          style={{
            gap: t.spacing.sm,
            padding: t.spacing.lg,
            borderRadius: t.radius.md,
            backgroundColor: t.palette.warningMuted,
          }}
        >
          <Text accessibilityRole="alert" style={[t.type.body, { color: t.palette.warning }]}>
            Notifications are turned off, so this reminder won’t alert you. Turn them on in your device settings.
          </Text>
          <Button label="Open settings" variant="secondary" size="sm" onPress={() => void openNotificationSettings()} />
        </View>
      ) : null}

      {value && permission.state === "unavailable" ? (
        <Text
          accessibilityRole="alert"
          style={[
            t.type.body,
            {
              color: t.palette.warning,
              backgroundColor: t.palette.warningMuted,
              padding: t.spacing.lg,
              borderRadius: t.radius.md,
              overflow: "hidden",
            },
          ]}
        >
          This build can’t show notifications (Expo Go doesn’t support them fully), so the reminder is saved but won’t
          alert you. Use a development build to get reminders.
        </Text>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={[t.type.caption, { color: t.palette.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
