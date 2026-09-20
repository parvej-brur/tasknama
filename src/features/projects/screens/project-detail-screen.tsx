import { Stack, useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";

import { showSnackbar } from "@/components/feedback/feedback";
import { ListGate } from "@/components/feedback/list-gate";
import { NotFoundState } from "@/components/feedback/not-found";
import { EmptyState } from "@/components/feedback/states";
import { Hero, heroInk } from "@/components/layout/hero";
import { Button } from "@/components/ui/button";
import { Fab } from "@/components/ui/fab";
import { ProgressBar } from "@/components/ui/progress-bar";
import { deleteProject, setProjectArchived } from "@/features/projects/actions";
import { selectProjectProgress } from "@/features/projects/selectors";
import { useTaskControls } from "@/features/tasks/components/task-controls";
import { TaskList, sectionsToItems } from "@/features/tasks/components/task-list";
import { useRefresh } from "@/features/tasks/hooks/use-refresh";
import { selectAllTasks } from "@/features/tasks/selectors";
import { queryTasks } from "@/features/tasks/task-query";
import { useClock } from "@/hooks/use-clock";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// A project's tasks with its progress, plus edit / archive / delete.
export function ProjectDetailScreen({ id }: { id: string }) {
  const t = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.projects.byId[id]);
  const progress = useAppSelector(selectProjectProgress)[id] ?? { done: 0, total: 0 };
  const tasks = useAppSelector(selectAllTasks);
  const clock = useClock();
  const refresh = useRefresh();
  const { query, element, isFiltering } = useTaskControls({
    initial: { status: "active" },
    hide: ["project"],
  });

  if (!project) return <NotFoundState title="Project not found" />;

  const shown = queryTasks(
    tasks.filter((task) => task.projectId === id),
    query,
    clock,
  );

  const confirmDelete = () =>
    Alert.alert(
      `Delete “${project.name}”?`,
      progress.total > 0
        ? `Its ${progress.total} ${progress.total === 1 ? "task moves" : "tasks move"} to Inbox. This can’t be undone.`
        : "This can’t be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete project",
          style: "destructive",
          onPress: () => {
            dispatch(deleteProject(id));
            showSnackbar({ message: `Deleted project “${project.name}”` });
            router.back();
          },
        },
      ],
    );

  const toggleArchive = () => {
    dispatch(setProjectArchived(id, !project.archived));
    if (!project.archived) {
      showSnackbar({
        message: `Archived “${project.name}”`,
        actionLabel: "Undo",
        onAction: () => dispatch(setProjectArchived(id, false)),
      });
      router.back();
    } else {
      showSnackbar({ message: `Restored “${project.name}”` });
    }
  };

  const color = t.projectColor(project.color);
  const ink = heroInk(t, color);
  const header = (
    <View style={{ padding: t.spacing.lg, paddingBottom: 0, gap: t.spacing.md }}>
      <Hero color={color} decor="tonal">
        <Text style={[t.type.subheading, { color: ink.muted }]}>{project.archived ? "ARCHIVED PROJECT" : "PROJECT"}</Text>
        <Text accessibilityRole="header" style={[t.type.title, { color: ink.fg, maxWidth: "85%" }]}>
          {project.name}
        </Text>
        <Text style={[t.type.bodyStrong, { color: ink.fg }]}>
          {progress.done} of {progress.total} done
        </Text>
        <ProgressBar
          done={progress.done}
          total={progress.total}
          color={ink.fill}
          trackColor={ink.track}
          height={12}
          label="Project progress"
        />
      </Hero>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
        <Button label="Edit" variant="secondary" size="sm" icon="create-outline" style={{ flexGrow: 1 }} onPress={() => router.push({ pathname: "/project/edit/[id]", params: { id } })} />
        <Button label={project.archived ? "Restore" : "Archive"} variant="secondary" size="sm" icon={project.archived ? "arrow-undo-outline" : "archive-outline"} style={{ flexGrow: 1 }} onPress={toggleArchive} />
        <Button label="Delete" variant="danger" size="sm" icon="trash-outline" style={{ flexGrow: 1 }} onPress={confirmDelete} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      <Stack.Screen options={{ title: project.name }} />
      <ListGate>
        <TaskList
          items={sectionsToItems([{ key: "p", title: project.name, tasks: shown, bare: true }], clock)}
          today={clock.today}
          onRefresh={refresh}
          header={
            <View>
              {header}
              {element}
            </View>
          }
          empty={
            isFiltering ? (
              <EmptyState icon="search-outline" tint="slate" title="No matches" message="No tasks in this project match." />
            ) : (
              <EmptyState icon="albums-outline" tint="amber" title="No tasks here" message="Add a task to this project with the + button." />
            )
          }
        />
      </ListGate>
      {project.archived ? null : <Fab projectId={id} />}
    </View>
  );
}
