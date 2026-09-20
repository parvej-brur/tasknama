import { LIMITS } from "@/config/limits";
import { REMINDER_PRESETS } from "@/features/notifications/types";
import { isRecord } from "@/utils/validation";

import { DEFAULT_SETTINGS, THEME_MODES, type Settings } from "./types";

export function coerceSettings(raw: unknown): Settings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS };
  const minutes = raw.focusMinutes;
  return {
    theme: (THEME_MODES as readonly unknown[]).includes(raw.theme)
      ? (raw.theme as Settings["theme"])
      : DEFAULT_SETTINGS.theme,
    defaultReminder: (REMINDER_PRESETS as readonly unknown[]).includes(raw.defaultReminder)
      ? (raw.defaultReminder as Settings["defaultReminder"])
      : DEFAULT_SETTINGS.defaultReminder,
    focusMinutes:
      typeof minutes === "number" &&
      Number.isInteger(minutes) &&
      minutes >= LIMITS.focusMinutesMin &&
      minutes <= LIMITS.focusMinutesMax
        ? minutes
        : DEFAULT_SETTINGS.focusMinutes,
  };
}

