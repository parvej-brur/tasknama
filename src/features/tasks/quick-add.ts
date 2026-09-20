import * as chrono from "chrono-node";

import { LIMITS } from "@/config/limits";
import {
  addDays,
  parseTimeKey,
  toDateKey,
  weekdayOf,
  type DateKey,
  type TimeKey,
} from "@/utils/date";

import type { Priority, Recurrence } from "./types";

// Pieces of a quick-add sentence the user can switch off before saving.
export type QuickAddPart = "date" | "time" | "priority" | "recurrence";
// `tag:<lowercase name>` switches off a single tag.
export type QuickAddDisabled = ReadonlySet<QuickAddPart | `tag:${string}`>;

export type QuickAddTag = {
  name: string;
  // Id of the matching existing tag, or null when it will be created.
  existingId: string | null;
};

export type QuickAddResult = {
  title: string;
  dueDate: DateKey | null;
  dueTime: TimeKey | null;
  priority: Priority | null;
  tags: QuickAddTag[];
  recurrence: Recurrence | null;
};

export type QuickAddOptions = {
  now: Date;
  existingTags: readonly { id: string; name: string }[];
  disabled?: QuickAddDisabled;
};

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const TAG_RE = /(^|\s)#([\wÀ-￿-]+)/g;

// Checked in order; the first priority found in the text wins.
const PRIORITY_PATTERNS: { re: RegExp; level: (m: RegExpMatchArray) => Priority }[] = [
  { re: /(^|\s)!(high|medium|low)\b/gi, level: (m) => m[2].toLowerCase() as Priority },
  { re: /(^|\s)(high|medium|low)\s+priority\b/gi, level: (m) => m[2].toLowerCase() as Priority },
  { re: /(^|\s)p([123])\b/gi, level: (m) => (["high", "medium", "low"] as const)[Number(m[2]) - 1] },
  { re: /(^|\s)urgent\b/gi, level: () => "high" },
];

type RecurrenceMatch = {
  rule: "daily" | "weekly" | "monthly" | "custom";
  weekday?: number;
  interval?: number;
  unit?: "day" | "week" | "month";
};

const RECURRENCE_RE =
  /(^|\s)every\s+(?:(\d+)\s+(day|week|month)s?|(day|week|month)|([a-z]+))\b/gi;

function findRecurrence(text: string): { match: RegExpMatchArray; parsed: RecurrenceMatch } | null {
  for (const match of text.matchAll(RECURRENCE_RE)) {
    if (match[2] && match[3]) {
      const interval = Number(match[2]);
      if (interval >= 1 && interval <= 365) {
        return {
          match,
          parsed: { rule: "custom", interval, unit: match[3].toLowerCase() as "day" | "week" | "month" },
        };
      }
    } else if (match[4]) {
      const unit = match[4].toLowerCase();
      return {
        match,
        parsed: { rule: unit === "day" ? "daily" : unit === "week" ? "weekly" : "monthly" },
      };
    } else if (match[5]) {
      const weekday = WEEKDAY_NAMES[match[5].toLowerCase()];
      if (weekday !== undefined) return { match, parsed: { rule: "weekly", weekday } };
    }
  }
  return null;
}

function removeSpan(text: string, index: number, length: number): string {
  return `${text.slice(0, index)} ${text.slice(index + length)}`;
}

const TRAILING_CONNECTORS = /\s+(?:on|at|by|in|for|due|before|from|until|to)$/i;

function cleanTitle(text: string): string {
  let title = text.replace(/\s+/g, " ").trim();
  let previous = "";
  while (title !== previous) {
    previous = title;
    title = title
      .replace(/^[\s,;:.\-–—]+|[\s,;:\-–—]+$/g, "")
      .replace(TRAILING_CONNECTORS, "")
      .trim();
  }
  return title.slice(0, LIMITS.titleMax);
}

// Today if `time` is still ahead of now, otherwise tomorrow.
function nextOccurrenceOfTime(now: Date, time: TimeKey | null): DateKey {
  const today = toDateKey(now);
  if (!time) return today;
  const { hours, minutes } = parseTimeKey(time);
  const ahead = hours * 60 + minutes > now.getHours() * 60 + now.getMinutes();
  return ahead ? today : addDays(today, 1);
}

function fallback(input: string): QuickAddResult {
  return {
    title: input.trim().slice(0, LIMITS.titleMax),
    dueDate: null,
    dueTime: null,
    priority: null,
    tags: [],
    recurrence: null,
  };
}

// Turns one line of natural language into task fields. Runs entirely on
// device (chrono-node for dates and times). Never throws: on any failure the
// raw text becomes the title.
export function parseQuickAdd(input: string, options: QuickAddOptions): QuickAddResult {
  try {
    return parse(input, options);
  } catch {
    return fallback(input);
  }
}

function parse(input: string, { now, existingTags, disabled }: QuickAddOptions): QuickAddResult {
  const off = (part: QuickAddPart | `tag:${string}`) => disabled?.has(part) === true;
  let text = ` ${input} `;

  // Tags: #word
  const tags: QuickAddTag[] = [];
  text = text.replace(TAG_RE, (whole, lead: string, name: string) => {
    if (off(`tag:${name.toLowerCase()}`)) return whole;
    if (!tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      const existing = existingTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      tags.push({
        name: existing ? existing.name : name.slice(0, LIMITS.nameMax),
        existingId: existing?.id ?? null,
      });
    }
    return lead;
  });

  // Priority: the first phrase in the text decides; every phrase is removed.
  let priority: Priority | null = null;
  if (!off("priority")) {
    let earliest = Infinity;
    for (const { re, level } of PRIORITY_PATTERNS) {
      for (const match of text.matchAll(re)) {
        if ((match.index ?? Infinity) < earliest) {
          earliest = match.index ?? Infinity;
          priority = level(match);
        }
      }
      text = text.replace(re, "$1");
    }
  }

  // Recurrence phrases are removed before chrono so "every Monday" isn't
  // mistaken for a single date.
  let recurrenceMatch: RecurrenceMatch | null = null;
  if (!off("recurrence")) {
    const found = findRecurrence(text);
    if (found) {
      recurrenceMatch = found.parsed;
      text = removeSpan(text, found.match.index ?? 0, found.match[0].length);
    }
  }

  // Date and time via chrono; future dates preferred.
  let dueDate: DateKey | null = null;
  let dueTime: TimeKey | null = null;
  if (!off("date")) {
    const [result] = chrono.parse(text, now, { forwardDate: true });
    if (result) {
      const start = result.start;
      const hasTime = start.isCertain("hour");
      if (hasTime) {
        const hour = String(start.get("hour") ?? 0).padStart(2, "0");
        const minute = String(start.get("minute") ?? 0).padStart(2, "0");
        dueTime = `${hour}:${minute}`;
      }
      const hasDay =
        start.isCertain("day") || start.isCertain("month") || start.isCertain("weekday");
      // A time with no day is resolved below: today if still ahead, else tomorrow.
      if (hasDay) dueDate = toDateKey(start.date());
      text = removeSpan(text, result.index, result.text.length);
    }
  }
  if (dueTime && off("time")) dueTime = null;

  // Recurrence needs a date; anchor it to the phrase when none was given.
  let recurrence: Recurrence | null = null;
  if (recurrenceMatch) {
    if (!dueDate) dueDate = nextOccurrenceOfTime(now, dueTime);
    if (recurrenceMatch.rule === "weekly" && recurrenceMatch.weekday !== undefined) {
      const wanted = recurrenceMatch.weekday;
      let candidate = dueDate;
      for (let i = 0; i < 7 && weekdayOf(candidate) !== wanted; i += 1) {
        candidate = addDays(candidate, 1);
      }
      dueDate = candidate;
      recurrence = { kind: "weekly", weekdays: [wanted] };
    } else if (recurrenceMatch.rule === "weekly") {
      recurrence = { kind: "weekly", weekdays: [weekdayOf(dueDate)] };
    } else if (recurrenceMatch.rule === "monthly") {
      recurrence = { kind: "monthly", dayOfMonth: Number(dueDate.slice(8, 10)) };
    } else if (recurrenceMatch.rule === "custom") {
      recurrence = {
        kind: "custom",
        interval: recurrenceMatch.interval ?? 1,
        unit: recurrenceMatch.unit ?? "day",
      };
    } else {
      recurrence = { kind: "daily" };
    }
  } else if (!dueDate && dueTime) {
    dueDate = nextOccurrenceOfTime(now, dueTime);
  }

  if (!dueDate) dueTime = null;

  return {
    title: cleanTitle(text),
    dueDate,
    dueTime,
    priority,
    tags,
    recurrence,
  };
}
