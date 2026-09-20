import { isIso, isRecord } from "@/utils/validation";

import { REMINDER_PRESETS, type Reminder } from "./types";

export function coerceReminder(raw: unknown): Reminder | null {
  if (!isRecord(raw)) return null;
  if (
    raw.kind === "preset" &&
    (REMINDER_PRESETS as readonly unknown[]).includes(raw.preset)
  ) {
    return { kind: "preset", preset: raw.preset as (typeof REMINDER_PRESETS)[number] };
  }
  if (raw.kind === "custom" && isIso(raw.at)) return { kind: "custom", at: raw.at };
  return null;
}
