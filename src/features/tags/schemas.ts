import { LIMITS } from "@/config/limits";
import { asString, isIso, isRecord } from "@/utils/validation";

import type { Tag } from "./types";

export function coerceTag(raw: unknown): Tag | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;
  const name = asString(raw.name).trim();
  if (!name) return null;
  const now = new Date().toISOString();
  const createdAt = isIso(raw.createdAt) ? raw.createdAt : now;
  return {
    id: raw.id,
    name: name.slice(0, LIMITS.nameMax),
    createdAt,
    updatedAt: isIso(raw.updatedAt) ? raw.updatedAt : createdAt,
  };
}
