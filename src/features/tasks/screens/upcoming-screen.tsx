import { useRouter } from "expo-router";
import { View } from "react-native";

import { ListGate } from "@/components/feedback/list-gate";
import { EmptyState } from "@/components/feedback/states";
import { HeaderActions } from "@/components/layout/header-actions";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Fab } from "@/components/ui/fab";
import { selectArchivedIds } from "@/features/projects/selectors";
import { useTaskControls } from "@/features/tasks/components/task-controls";
import { TaskList, groupsToSections, sectionsToItems } from "@/features/tasks/components/task-list";
import { useRefresh } from "@/features/tasks/hooks/use-refresh";
import { selectAllTasks } from "@/features/tasks/selectors";
import { queryTasks } from "@/features/tasks/task-query";
import { groupByDueDate, selectUpcoming } from "@/features/tasks/task-views";
import { useClock } from "@/hooks/use-clock";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// Upcoming: active tasks after today, grouped by date.
export function UpcomingScreen() {
  const t = useTheme();
  const router = useRouter();
  const tasks = useAppSelector(selectAllTasks);
  const archived = useAppSelector(selectArchivedIds);
  const clock = useClock();
  const refresh = useRefresh();
  const { query, element, isFiltering } = useTaskControls({
    initial: { status: "active" },
    hide: ["status"],
  });

  // Upcoming is defined by the base selector; the query then narrows and orders it.
  const base = selectUpcoming(tasks, clock.today, archived).flatMap((g) => g.tasks);
  const shown = queryTasks(base, query, clock);
  // Grouping by date only makes sense when the list is ordered by date.
  const sections =
    query.sortKey === "dueDate"
      ? groupsToSections(
          groupByDueDate(shown),
          clock.today,
        )
      : [{ key: "all", title: "Upcoming", tasks: shown, bare: true }];
  const items = sectionsToItems(sections, clock);

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      <ScreenHeader title="Upcoming" subtitle="Plan ahead" actions={<HeaderActions />} />
      <ListGate>
        {element}
        <TaskList
          items={items}
          today={clock.today}
          onRefresh={refresh}
          empty={
            isFiltering ? (
              <EmptyState icon="search-outline" tint="slate" title="No matches" message="No upcoming tasks match your search or filters." />
            ) : (
              <EmptyState
                icon="calendar-outline"
                tint="slate"
                title="Nothing coming up"
                message="Tasks with a future due date show up here."
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
