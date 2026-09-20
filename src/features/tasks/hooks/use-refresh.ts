import { useCallback } from "react";
import { useStore } from "react-redux";

import { reconcileFocus } from "@/features/focus/actions";
import { reconcileReminders } from "@/features/notifications/notifications";
import type { RootState } from "@/lib/store/create-store";
import { useAppDispatch } from "@/lib/store/hooks";

// Pull-to-refresh handler. All data is local, so "refresh" means re-checking
// the things that can drift while the app sits open: reminders and the timer.
export function useRefresh() {
  const store = useStore<RootState>();
  const dispatch = useAppDispatch();
  return useCallback(async () => {
    dispatch(reconcileFocus());
    await reconcileReminders(Object.values(store.getState().tasks.byId));
  }, [dispatch, store]);
}
