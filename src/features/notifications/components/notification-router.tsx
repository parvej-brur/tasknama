import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { Notifications } from "@/features/notifications/notifications-module";

// Chosen once at load, so the hook order never changes between renders. Without
// notification support there is simply never a response to act on.
const useLastResponse = Notifications?.useLastNotificationResponse ?? (() => null);

// Opens the right screen when a notification is tapped. `useLastNotificationResponse`
// covers all three cases: the app was killed (cold start), in the background,
// or already open. A tapped reminder for a task that no longer exists lands on
// the task screen's not-found state.
export function NotificationRouter() {
  const response = useLastResponse();
  const router = useRouter();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications?.DEFAULT_ACTION_IDENTIFIER) return;
    const { request, date } = response.notification;
    const key = `${request.identifier}:${date}`;
    if (handled.current === key) return;
    handled.current = key;

    const data = request.content.data as { kind?: string; taskId?: string } | null;
    const go = () => {
      if (data?.kind === "reminder" && typeof data.taskId === "string") {
        router.push({ pathname: "/task/[id]", params: { id: data.taskId } });
      } else if (data?.kind === "focus") {
        router.push("/focus");
      }
    };
    // On a cold start the navigator may not be ready on the first tick.
    const timer = setTimeout(() => {
      try {
        go();
      } catch {
        setTimeout(go, 400);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [response, router]);

  return null;
}
