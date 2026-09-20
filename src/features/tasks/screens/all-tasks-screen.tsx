import { View } from "react-native";

import { ListGate } from "@/components/feedback/list-gate";
import { EmptyState } from "@/components/feedback/states";
import { Fab } from "@/components/ui/fab";
import { useTaskControls } from "@/features/tasks/components/task-controls";
import { TaskList, sectionsToItems } from "@/features/tasks/components/task-list";
import { useRefresh } from "@/features/tasks/hooks/use-refresh";
import { selectAllTasks } from "@/features/tasks/selectors";
import { queryTasks } from "@/features/tasks/task-query";
import { useClock } from "@/hooks/use-clock";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// Every task, with the full set of search, filters and sort.
export function AllTasksScreen() {
  const t = useTheme();
  const tasks = useAppSelector(selectAllTasks);
  const clock = useClock();
  const refresh = useRefresh();
  const { query, element, isFiltering } = useTaskControls({});

  const shown = queryTasks(tasks, query, clock);
  const items = sectionsToItems([{ key: "all", title: "All tasks", tasks: shown, bare: true }], clock);

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      <ListGate>
        {element}
        <TaskList
          items={items}
          today={clock.today}
          onRefresh={refresh}
          empty={
            isFiltering ? (
              <EmptyState icon="search-outline" tint="slate" title="No matches" message="Try a different search or clear the filters." />
            ) : (
              <EmptyState icon="list-outline" tint="blue" title="No tasks yet" message="Tap + to add your first task." />
            )
          }
        />
      </ListGate>
      <Fab />
    </View>
  );
}
