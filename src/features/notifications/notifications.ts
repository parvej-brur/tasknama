import type * as NotificationsModule from "expo-notifications";
import { Linking, Platform } from "react-native";

import type { Task } from "@/features/tasks/types";

import { Notifications } from "./notifications-module";
import {
  diffReminders,
  isReminderIdentifier,
  planReminders,
  reminderIdentifier,
  reminderSignature,
  type PlannedReminder,
  type ScheduledReminder,
} from "./reminder-planner";

// `unavailable`: this build has no notification support (e.g. Expo Go).
export type PermissionState = "granted" | "denied" | "undetermined" | "unavailable";

export const REMINDER_CHANNEL = "reminders";
export const FOCUS_CHANNEL = "focus";
const focusIdentifier = (sessionId: string) => `focus:${sessionId}`;

// Show notifications that arrive while the app is open, without sound.
try {
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Not fatal: reminders still schedule, they just won't banner in the foreground.
}

let channelsReady: Promise<void> | null = null;

// Android notification channels. A no-op elsewhere.
export function ensureChannels(): Promise<void> {
  const N = Notifications;
  if (!N || Platform.OS !== "android") return Promise.resolve();
  channelsReady ??= (async () => {
    await N.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: "Task reminders",
      importance: N.AndroidImportance.HIGH,
    });
    await N.setNotificationChannelAsync(FOCUS_CHANNEL, {
      name: "Focus sessions",
      importance: N.AndroidImportance.HIGH,
    });
  })().catch((error) => {
    channelsReady = null;
    throw error;
  });
  return channelsReady;
}

function toState(
  N: typeof NotificationsModule,
  p: NotificationsModule.NotificationPermissionsStatus,
): PermissionState {
  if (p.granted || p.ios?.status === N.IosAuthorizationStatus.PROVISIONAL) return "granted";
  return p.status === N.PermissionStatus.DENIED ? "denied" : "undetermined";
}

export async function getPermissionState(): Promise<PermissionState> {
  const N = Notifications;
  if (!N) return "unavailable";
  try {
    return toState(N, await N.getPermissionsAsync());
  } catch {
    // The JS side loaded but a native call failed: treat notifications as unusable.
    return "unavailable";
  }
}

// Asks for permission the first time it is needed (when a reminder is set),
// never on launch. Once the user has denied it, the OS won't show the prompt
// again, so the caller shows a message with an "Open settings" button.
export async function ensurePermission(): Promise<PermissionState> {
  const N = Notifications;
  const current = await getPermissionState();
  if (!N || current !== "undetermined") return current;
  try {
    await ensureChannels();
    return toState(N, await N.requestPermissionsAsync());
  } catch {
    return "unavailable";
  }
}

export function openNotificationSettings(): Promise<void> {
  return Linking.openSettings();
}

// --- Reminders -------------------------------------------------------------

async function scheduledReminders(N: typeof NotificationsModule): Promise<ScheduledReminder[]> {
  const all = await N.getAllScheduledNotificationsAsync();
  return all
    .filter((n) => isReminderIdentifier(n.identifier))
    .map((n) => ({
      identifier: n.identifier,
      signature: String((n.content.data as { signature?: string } | null)?.signature ?? ""),
    }));
}

async function scheduleReminder(
  N: typeof NotificationsModule,
  reminder: PlannedReminder,
): Promise<void> {
  await N.scheduleNotificationAsync({
    identifier: reminderIdentifier(reminder.taskId),
    content: {
      title: reminder.title,
      body: reminder.body,
      data: {
        kind: "reminder",
        taskId: reminder.taskId,
        signature: reminderSignature(reminder),
      },
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: new Date(reminder.fireAt),
      channelId: REMINDER_CHANNEL,
    },
  });
}

let queue: Promise<void> = Promise.resolve();

// Makes the OS schedule match the tasks: only the next 50 upcoming reminders
// are registered (iOS allows 64 pending notifications in total), and reminders
// for completed, deleted or edited tasks are cancelled. Calls are serialized so
// overlapping triggers (start, foreground, edits) can't interleave.
export function reconcileReminders(tasks: Iterable<Task>, now: number = Date.now()): Promise<void> {
  const N = Notifications;
  if (!N) return Promise.resolve();
  const snapshot = [...tasks];
  queue = queue
    .then(async () => {
      if ((await getPermissionState()) !== "granted") return;
      await ensureChannels();
      const planned = planReminders(snapshot, now);
      const { cancel, schedule } = diffReminders(planned, await scheduledReminders(N));
      await Promise.all(cancel.map((id) => N.cancelScheduledNotificationAsync(id)));
      for (const reminder of schedule) await scheduleReminder(N, reminder);
    })
    .catch((error) => {
      if (__DEV__) console.warn("[notifications] reconcile failed", error);
    });
  return queue;
}

// --- Focus -----------------------------------------------------------------

export async function scheduleFocusEnd(
  sessionId: string,
  taskTitle: string,
  endsAt: number,
): Promise<void> {
  const N = Notifications;
  if (!N) return;
  try {
    if ((await ensurePermission()) !== "granted") return;
    await ensureChannels();
    await N.scheduleNotificationAsync({
      identifier: focusIdentifier(sessionId),
      content: {
        title: "Focus session complete",
        body: taskTitle,
        data: { kind: "focus", sessionId },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: new Date(endsAt),
        channelId: FOCUS_CHANNEL,
      },
    });
  } catch (error) {
    if (__DEV__) console.warn("[notifications] focus schedule failed", error);
  }
}

export async function cancelFocusEnd(sessionId: string): Promise<void> {
  try {
    await Notifications?.cancelScheduledNotificationAsync(focusIdentifier(sessionId));
  } catch {
    // Nothing scheduled: fine.
  }
}
