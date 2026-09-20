import { View } from "react-native";

import { ListGate } from "@/components/feedback/list-gate";
import { EmptyState } from "@/components/feedback/states";
import { useTaskControls } from "@/features/tasks/components/task-controls";
import { TaskList, groupsToSections, sectionsToItems } from "@/features/tasks/components/task-list";
import { useRefresh } from "@/features/tasks/hooks/use-refresh";
import { selectAllTasks } from "@/features/tasks/selectors";
import { queryTasks } from "@/features/tasks/task-query";
import { selectCompleted } from "@/features/tasks/task-views";
import { useClock } from "@/hooks/use-clock";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// Completed: newest first, grouped by the day each task was finished.
export function CompletedScreen() {
  const t = useTheme();
  const tasks = useAppSelector(selectAllTasks);
  const clock = useClock();
  const refresh = useRefresh();
  const { query, element, isFiltering } = useTaskControls({
    initial: { status: "completed" },
    hide: ["status", "sort"],
  });

  // Filter first, then let selectCompleted apply its own newest-first order.
  const filtered = queryTasks(tasks, query, clock);
  const items = sectionsToItems(groupsToSections(selectCompleted(filtered), clock.today), clock);

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
              <EmptyState icon="search-outline" tint="slate" title="No matches" message="No completed tasks match your search or filters." />
            ) : (
              <EmptyState
                icon="checkmark-done-outline"
                tint="purple"
                title="Nothing completed yet"
                message="Finished tasks are kept here so you can look back at them."
              />
            )
          }
        />
      </ListGate>
    </View>
  );
}
