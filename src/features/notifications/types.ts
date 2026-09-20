export const REMINDER_PRESETS = ["atDue", "10m", "1h", "1d"] as const;
export type ReminderPreset = (typeof REMINDER_PRESETS)[number];

export type Reminder =
  | { kind: "preset"; preset: ReminderPreset }
  // `at` is an ISO instant.
  | { kind: "custom"; at: string };
