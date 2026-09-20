import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useStore } from "react-redux";

import { UNDO_MS, showSnackbar } from "@/components/feedback/feedback";
import {
  completeTask,
  deleteTask,
  reopenTask,
  restoreTask,
  undoCompletion,
} from "@/features/tasks/actions";
import type { RootState } from "@/lib/store/create-store";
import { useAppDispatch } from "@/lib/store/hooks";

// Task actions with their snackbar feedback. The returned callbacks are stable,
// so memoized list rows that receive them don't re-render needlessly.
export function useTaskActions() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const router = useRouter();

  const open = useCallback(
    (id: string) => router.push({ pathname: "/task/[id]", params: { id } }),
    [router],
  );

  const toggle = useCallback(
    (id: string) => {
      const task = store.getState().tasks.byId[id];
      if (!task) return;
      if (task.completed) {
        dispatch(reopenTask(id));
        showSnackbar({ message: `Reopened “${task.title}”` });
        return;
      }
      const result = dispatch(completeTask(id));
      if (!result) return;
      showSnackbar({
        message: `Completed “${task.title}”`,
        actionLabel: "Undo",
        durationMs: UNDO_MS,
        onAction: () => dispatch(undoCompletion(id, result.nextId)),
      });
    },
    [dispatch, store],
  );

  const remove = useCallback(
    (id: string) => {
      const deleted = dispatch(deleteTask(id));
      if (!deleted) return;
      showSnackbar({
        message: `Deleted “${deleted.title}”`,
        actionLabel: "Undo",
        durationMs: UNDO_MS,
        // Restores the same record: same id, same data.
        onAction: () => dispatch(restoreTask(deleted)),
      });
    },
    [dispatch],
  );

  return { open, toggle, remove };
}
