import { useRouter } from "expo-router";
import { View } from "react-native";

import { ListGate } from "@/components/feedback/list-gate";
import { EmptyState } from "@/components/feedback/states";
import { HeaderActions } from "@/components/layout/header-actions";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Fab } from "@/components/ui/fab";
import { useTaskControls } from "@/features/tasks/components/task-controls";
import { TaskList, sectionsToItems } from "@/features/tasks/components/task-list";
import { useRefresh } from "@/features/tasks/hooks/use-refresh";
import { selectAllTasks } from "@/features/tasks/selectors";
import { queryTasks } from "@/features/tasks/task-query";
import { selectInbox } from "@/features/tasks/task-views";
import { useClock } from "@/hooks/use-clock";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// Inbox: active tasks that don't belong to a project.
export function InboxScreen() {
  const t = useTheme();
  const router = useRouter();
  const tasks = useAppSelector(selectAllTasks);
  const clock = useClock();
  const refresh = useRefresh();
  const { query, element, isFiltering } = useTaskControls({
    initial: { status: "active" },
    hide: ["status", "project"],
  });

  const shown = queryTasks(selectInbox(tasks), query, clock);
  const items = sectionsToItems([{ key: "inbox", title: "Inbox", tasks: shown, bare: true }], clock);

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      <ScreenHeader title="Inbox" subtitle="Tasks without a project" actions={<HeaderActions quickAdd />} />
      <ListGate>
        {element}
        <TaskList
          items={items}
          today={clock.today}
          onRefresh={refresh}
          empty={
            isFiltering ? (
              <EmptyState icon="search-outline" tint="slate" title="No matches" message="No inbox tasks match your search or filters." />
            ) : (
              <EmptyState
                icon="file-tray-outline"
                tint="purple"
                title="Inbox is empty"
                message="Tasks without a project land here."
                actionLabel="Add a task"
                onAction={() => router.push("/task/new")}
              />
            )
          }
        />
      </ListGate>
      <Fab />
    </View>
  );
}
