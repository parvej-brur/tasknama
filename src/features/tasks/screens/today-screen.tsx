import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { ListGate } from "@/components/feedback/list-gate";
import { EmptyState } from "@/components/feedback/states";
import { HeaderActions } from "@/components/layout/header-actions";
import { Hero, heroInk } from "@/components/layout/hero";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Fab } from "@/components/ui/fab";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress-bar";
import { selectArchivedIds } from "@/features/projects/selectors";
import { TaskList, sectionsToItems } from "@/features/tasks/components/task-list";
import { useRefresh } from "@/features/tasks/hooks/use-refresh";
import { selectAllTasks } from "@/features/tasks/selectors";
import { selectToday } from "@/features/tasks/task-views";
import { useClock } from "@/hooks/use-clock";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";
import { parseDateKey } from "@/utils/date";

function greeting(time: string): string {
  const hour = Number(time.slice(0, 2));
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
}

// Today doubles as the dashboard: progress, overdue, today, and high priority.
export function TodayScreen() {
  const t = useTheme();
  const router = useRouter();
  const tasks = useAppSelector(selectAllTasks);
  const archived = useAppSelector(selectArchivedIds);
  const clock = useClock();
  const refresh = useRefresh();

  const { overdue, today, highPriority, progress } = selectToday(
    tasks,
    clock,
    archived,
  );
  const items = sectionsToItems(
    [
      { key: "overdue", title: "Overdue", tone: "danger", tasks: overdue },
      { key: "today", title: "Today", tone: "highlight", tasks: today },
      { key: "high", title: "High priority", tasks: highPriority },
    ],
    clock,
  );

  const date = parseDateKey(clock.today);
  const dateLabel = date
    ? date.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : undefined;
  const ink = heroInk(t);
  const left = progress.total - progress.done;
  const headline =
    progress.total === 0
      ? "Nothing due today"
      : left === 0
        ? "All done for today"
        : `${left} ${left === 1 ? "task" : "tasks"} left`;

  const header = (
    <View>
      <ScreenHeader
        title={greeting(clock.time)}
        subtitle={dateLabel}
        actions={<HeaderActions quickAdd />}
      />
      <View
        style={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.sm }}
      >
        <Hero>
          <View>
            <Text
              accessibilityRole="header"
              style={[t.type.subheading, { color: ink.muted }]}
            >
              TODAY
            </Text>
            <Text
              style={[
                t.type.display,
                { color: ink.fg, marginTop: t.spacing.xs, maxWidth: "80%" },
              ]}
            >
              {headline}
            </Text>
            {progress.total > 0 ? (
              <Text style={[t.type.bodyStrong, { color: ink.muted }]}>
                {progress.done} of {progress.total} completed
              </Text>
            ) : null}
          </View>

          {progress.total > 0 ? (
            <ProgressBar
              done={progress.done}
              total={progress.total}
              label="Tasks due today done"
              color={ink.fill}
              trackColor={ink.track}
              height={10}
            />
          ) : null}

          {overdue.length > 0 ? (
            <View style={{ flexDirection: "row" }}>
              <Pill
                icon="alert-circle"
                label={`${overdue.length} overdue ${overdue.length === 1 ? "task" : "tasks"}`}
                fg={t.palette.onAccent}
                bg={t.palette.accent}
              />
            </View>
          ) : null}
        </Hero>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      <ListGate>
        <TaskList
          items={items}
          today={clock.today}
          header={header}
          onRefresh={refresh}
          empty={
            <EmptyState
              icon="sunny-outline"
              tint="amber"
              title="You’re all clear"
              message="Nothing is overdue or due today. Add a task, or plan ahead in Upcoming."
              actionLabel="Add a task"
              onAction={() => router.push("/task/new")}
            />
          }
        />
      </ListGate>

      <Fab />
    </View>
  );
}
