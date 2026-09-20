import { Stack, useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";

import { showSnackbar } from "@/components/feedback/feedback";
import { ListGate } from "@/components/feedback/list-gate";
import { NotFoundState } from "@/components/feedback/not-found";
import { EmptyState } from "@/components/feedback/states";
import { Hero, heroInk } from "@/components/layout/hero";
import { Button } from "@/components/ui/button";
import { deleteTag } from "@/features/tags/actions";
import { selectTagCounts } from "@/features/tags/selectors";
import { useTaskControls } from "@/features/tasks/components/task-controls";
import { TaskList, sectionsToItems } from "@/features/tasks/components/task-list";
import { useRefresh } from "@/features/tasks/hooks/use-refresh";
import { selectAllTasks } from "@/features/tasks/selectors";
import { queryTasks } from "@/features/tasks/task-query";
import { useClock } from "@/hooks/use-clock";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// Tasks carrying one tag, with rename and delete.
export function TagDetailScreen({ id }: { id: string }) {
  const t = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tag = useAppSelector((s) => s.tags.byId[id]);
  const count = useAppSelector(selectTagCounts)[id] ?? 0;
  const tasks = useAppSelector(selectAllTasks);
  const clock = useClock();
  const refresh = useRefresh();
  const { query, element, isFiltering } = useTaskControls({
    initial: { status: "active" },
    hide: ["tag"],
  });

  if (!tag) return <NotFoundState title="Tag not found" />;

  const shown = queryTasks(
    tasks.filter((task) => task.tagIds.includes(id)),
    query,
    clock,
  );

  const confirmDelete = () =>
    Alert.alert(
      `Delete #${tag.name}?`,
      count > 0
        ? `It will be removed from ${count} ${count === 1 ? "task" : "tasks"}. The tasks themselves are kept.`
        : "This can’t be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete tag",
          style: "destructive",
          onPress: () => {
            dispatch(deleteTag(id));
            showSnackbar({ message: `Deleted tag #${tag.name}` });
            router.back();
          },
        },
      ],
    );

  const ink = heroInk(t);
  const header = (
    <View style={{ padding: t.spacing.lg, paddingBottom: 0, gap: t.spacing.md }}>
      <Hero decor="tonal">
        <Text style={[t.type.subheading, { color: ink.muted }]}>TAG</Text>
        <Text accessibilityRole="header" style={[t.type.title, { color: ink.fg, maxWidth: "85%" }]}>
          #{tag.name}
        </Text>
        <Text style={[t.type.bodyStrong, { color: ink.fg }]}>
          {count} {count === 1 ? "task" : "tasks"}
        </Text>
      </Hero>
      <View style={{ flexDirection: "row", gap: t.spacing.sm }}>
        <Button label="Rename" variant="secondary" size="sm" icon="create-outline" style={{ flex: 1 }} onPress={() => router.push({ pathname: "/tag/edit/[id]", params: { id } })} />
        <Button label="Delete" variant="danger" size="sm" icon="trash-outline" style={{ flex: 1 }} onPress={confirmDelete} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      <Stack.Screen options={{ title: `#${tag.name}` }} />
      <ListGate>
        <TaskList
          items={sectionsToItems([{ key: "t", title: tag.name, tasks: shown, bare: true }], clock)}
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
              <EmptyState icon="search-outline" tint="slate" title="No matches" message="No tasks with this tag match." />
            ) : (
              <EmptyState icon="pricetag-outline" tint="slate" title="No tasks with this tag" message="Add the tag to a task from its form." />
            )
          }
        />
      </ListGate>
    </View>
  );
}
