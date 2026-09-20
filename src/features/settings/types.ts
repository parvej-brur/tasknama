import type { ReminderPreset } from "@/features/notifications/types";

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export type Settings = {
  theme: ThemeMode;
  // Preset applied when a reminder is first switched on.
  defaultReminder: ReminderPreset;
  focusMinutes: number;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  defaultReminder: "10m",
  focusMinutes: 25,
};
