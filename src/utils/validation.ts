import { LIMITS } from "@/config/limits";

// Shared validation helpers. Feature-specific rules live in each feature's
// `schemas.ts`.

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

// Name rules shared by projects and tags: required, unique ignoring case.
export function validateName(
  name: string,
  existing: readonly { id: string; name: string }[],
  selfId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required.";
  if (trimmed.length > LIMITS.nameMax) {
    return `Name must be ${LIMITS.nameMax} characters or fewer.`;
  }
  const lower = trimmed.toLowerCase();
  const clash = existing.some(
    (item) => item.id !== selfId && item.name.trim().toLowerCase() === lower,
  );
  return clash ? "That name is already taken." : null;
}

// ---------------------------------------------------------------------------
// Primitives for coercing untrusted data (storage, imports).
// ---------------------------------------------------------------------------

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isIso = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(new Date(value).getTime());

export const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

// Result of saving an entity that is identified by a unique name (project, tag).
export type NameSaveResult = { ok: true; id: string } | { ok: false; error: string };
