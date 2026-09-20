import { AccessibilityInfo } from "react-native";

// Screen reader announcement (VoiceOver / TalkBack). Safe to call anywhere.
export function announce(message: string): void {
  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch {
    // Announcements are best-effort.
  }
}

export type SnackbarOptions = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  // Defaults to 5 s when there is an action, 3 s otherwise.
  durationMs?: number;
  tone?: "default" | "error";
};

export type SnackbarItem = SnackbarOptions & { id: number };

type Listener = (item: SnackbarItem | null) => void;

let counter = 0;
let current: SnackbarItem | null = null;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((listener) => listener(current));

// Shows a snackbar, replacing any that is already visible.
export function showSnackbar(options: SnackbarOptions): void {
  counter += 1;
  current = { ...options, id: counter };
  announce(
    options.actionLabel ? `${options.message}. ${options.actionLabel} available.` : options.message,
  );
  emit();
}

export function dismissSnackbar(id?: number): void {
  if (id !== undefined && current?.id !== id) return;
  current = null;
  emit();
}

export function subscribeSnackbar(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export const UNDO_MS = 5000;
