import { LIMITS } from "@/config/limits";
import { asString, isIso, isRecord } from "@/utils/validation";

import { PROJECT_COLOR_IDS, type Project } from "./types";

export function coerceProject(raw: unknown): Project | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;
  const name = asString(raw.name).trim();
  if (!name) return null;
  const now = new Date().toISOString();
  const createdAt = isIso(raw.createdAt) ? raw.createdAt : now;
  return {
    id: raw.id,
    name: name.slice(0, LIMITS.nameMax),
    color: (PROJECT_COLOR_IDS as readonly unknown[]).includes(raw.color)
      ? (raw.color as Project["color"])
      : "teal",
    archived: raw.archived === true,
    createdAt,
    updatedAt: isIso(raw.updatedAt) ? raw.updatedAt : createdAt,
  };
}
