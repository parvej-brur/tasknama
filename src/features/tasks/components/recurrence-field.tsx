import { Text, View } from "react-native";

import { Chip } from "@/components/ui/chip";
import { FieldLabel } from "@/components/ui/field-label";
import { IconButton } from "@/components/ui/icon-button";
import type { Recurrence, RecurrenceUnit } from "@/features/tasks/types";
import { useTheme } from "@/theme";
import { WEEKDAY_LABELS, weekdayOf, type DateKey } from "@/utils/date";

type Props = {
  value: Recurrence | null;
  onChange: (value: Recurrence | null) => void;
  dueDate: DateKey | null;
  error?: string | null;
};

const UNITS: RecurrenceUnit[] = ["day", "week", "month"];
// Monday-first display order of weekday indexes (0 = Sunday).
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "increment") onChange(Math.min(max, value + 1));
        else onChange(Math.max(min, value - 1));
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: t.spacing.xs,
        padding: t.spacing.xs,
        borderRadius: t.radius.pill,
        backgroundColor: t.palette.surfaceAlt,
      }}
    >
      <IconButton icon="remove-circle-outline" label={`Decrease ${label}`} disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text style={[t.type.heading, { color: t.palette.text, minWidth: 40, textAlign: "center", fontVariant: ["tabular-nums"] }]}>{value}</Text>
      <IconButton icon="add-circle-outline" label={`Increase ${label}`} disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

// Daily, weekly (pick weekdays), monthly (day of month) or every N days/weeks/months.
export function RecurrenceField({ value, onChange, dueDate, error }: Props) {
  const t = useTheme();
  const kind = value?.kind ?? "none";
  const dayFromDate = dueDate ? Number(dueDate.slice(8, 10)) : 1;

  const select = (next: Recurrence["kind"] | "none") => {
    if (next === "none") return onChange(null);
    if (next === "daily") return onChange({ kind: "daily" });
    if (next === "weekly") {
      return onChange({ kind: "weekly", weekdays: [dueDate ? weekdayOf(dueDate) : 1] });
    }
    if (next === "monthly") return onChange({ kind: "monthly", dayOfMonth: dayFromDate });
    return onChange({ kind: "custom", interval: 2, unit: "day" });
  };

  return (
    <View style={{ gap: t.spacing.sm }}>
      <FieldLabel label="Repeat" />
      {!dueDate ? (
        <Text style={[t.type.caption, { color: t.palette.textMuted }]}>Repeating needs a due date.</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
          {(["none", "daily", "weekly", "monthly", "custom"] as const).map((k) => (
            <Chip
              key={k}
              label={k === "none" ? "Never" : k === "custom" ? "Custom" : k[0].toUpperCase() + k.slice(1)}
              selected={kind === k}
              onPress={() => select(k)}
            />
          ))}
        </View>
      )}

      {value?.kind === "weekly" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
          {WEEK_ORDER.map((day) => {
            const on = value.weekdays.includes(day);
            return (
              <Chip
                key={day}
                label={WEEKDAY_LABELS[day]}
                selected={on}
                onPress={() => {
                  const next = on ? value.weekdays.filter((d) => d !== day) : [...value.weekdays, day];
                  // At least one weekday must stay selected.
                  if (next.length > 0) onChange({ kind: "weekly", weekdays: next });
                }}
              />
            );
          })}
        </View>
      ) : null}

      {value?.kind === "monthly" ? (
        <View style={{ gap: t.spacing.xs }}>
          <Stepper
            label="Day of month"
            value={value.dayOfMonth}
            min={1}
            max={31}
            onChange={(dayOfMonth) => onChange({ kind: "monthly", dayOfMonth })}
          />
          {value.dayOfMonth > 28 ? (
            <Text style={[t.type.caption, { color: t.palette.textMuted }]}>
              In shorter months this repeats on the last day of the month.
            </Text>
          ) : null}
        </View>
      ) : null}

      {value?.kind === "custom" ? (
        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.sm }}>
            <Text style={[t.type.body, { color: t.palette.text }]}>Every</Text>
            <Stepper
              label="Repeat interval"
              value={value.interval}
              min={1}
              max={365}
              onChange={(interval) => onChange({ ...value, interval })}
            />
          </View>
          <View style={{ flexDirection: "row", gap: t.spacing.sm }}>
            {UNITS.map((unit) => (
              <Chip
                key={unit}
                label={value.interval === 1 ? unit : `${unit}s`}
                selected={value.unit === unit}
                onPress={() => onChange({ ...value, unit })}
              />
            ))}
          </View>
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
