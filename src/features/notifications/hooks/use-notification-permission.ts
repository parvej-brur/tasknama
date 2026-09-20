import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  ensurePermission,
  getPermissionState,
  type PermissionState,
} from "@/features/notifications/notifications";

// Current notification permission. Re-reads when the app returns to the
// foreground, so coming back from the system settings updates the screen.
// `request()` only prompts if the OS hasn't been asked yet.
export function useNotificationPermission() {
  const [state, setState] = useState<PermissionState | null>(null);

  const refresh = useCallback(async () => {
    setState(await getPermissionState());
  }, []);

  const request = useCallback(async () => {
    const next = await ensurePermission();
    setState(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { state, refresh, request };
}
