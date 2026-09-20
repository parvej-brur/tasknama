import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { Text, View } from "react-native";

import { NotFoundState } from "@/components/feedback/not-found";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { IconTile } from "@/components/ui/icon-tile";
import { Pill } from "@/components/ui/pill";
import { PRESET_LABELS, reminderFireAt } from "@/features/notifications/reminder-planner";
import {
  addSubtask,
  editSubtask,
  moveSubtask,
  removeSubtask,
  toggleSubtask,
} from "@/features/tasks/actions";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { SubtaskList } from "@/features/tasks/components/subtask-list";
import { useTaskActions } from "@/features/tasks/hooks/use-task-actions";
import { describeRecurrence } from "@/features/tasks/recurrence";
import { isOverdue } from "@/features/tasks/task-views";
import type { Task } from "@/features/tasks/types";
import { useClock } from "@/hooks/use-clock";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useTheme, type TintName } from "@/theme";
import { dateKeyOfInstant, formatDay, formatDueLabel, formatTime, toTimeKey } from "@/utils/date";

function Meta({
  icon,
  tint,
  label,
  value,
  danger = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tint: TintName;
  label: string;
  value: string;
  danger?: boolean;
}) {
  const t = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
      <IconTile icon={icon} tint={danger ? "orange" : tint} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={[t.type.caption, { color: t.palette.textMuted }]}>{label}</Text>
        <Text style={[t.type.bodyStrong, { color: danger ? t.palette.danger : t.palette.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function describeReminder(task: Task, today: string): string | null {
  if (!task.reminder) return null;
  const fire = reminderFireAt(task);
  const when = fire
    ? `${formatDay(dateKeyOfInstant(fire.toISOString()) ?? today, today)} ${formatTime(toTimeKey(fire))}`
    : null;
  if (task.reminder.kind === "custom") return when ?? "Custom time";
  return when ? `${PRESET_LABELS[task.reminder.preset]} (${when})` : PRESET_LABELS[task.reminder.preset];
}

// A task's full details. A missing task (bad deep link, old notification) shows a not-found screen.
export function TaskDetailScreen({ id }: { id: string }) {
  const t = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const clock = useClock();
  const task = useAppSelector((s) => s.tasks.byId[id]);
  const project = useAppSelector((s) => (task?.projectId ? s.projects.byId[task.projectId] : undefined));
  const tagNames = useAppSelector((s) =>
    (task?.tagIds ?? []).map((tagId) => s.tags.byId[tagId]?.name ?? "").filter(Boolean).join("\u0000"),
  );
  const { toggle, remove } = useTaskActions();

  if (!task) {
    return (
      <>
        <Stack.Screen options={{ title: "Not found" }} />
        <NotFoundState title="Task not found" message="This task may have been deleted, or the link is out of date." />
      </>
    );
  }

  const tags = tagNames ? tagNames.split("\u0000") : [];
  const overdue = isOverdue(task, clock);
  const due = formatDueLabel(task.dueDate, task.dueTime, clock.today);
  const reminder = describeReminder(task, clock.today);
  const created = new Date(task.createdAt);
  const updated = new Date(task.updatedAt);
  const stamp = (d: Date) => `${formatDay(dateKeyOfInstant(d.toISOString()) ?? clock.today, clock.today)} ${formatTime(toTimeKey(d))}`;

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          title: "Task",
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Edit task"
              onPress={() => router.push({ pathname: "/task/edit/[id]", params: { id } })}
            />
          ),
        }}
      />

      <View style={{ gap: t.spacing.md }}>
        <Text
          accessibilityRole="header"
          style={[
            t.type.title,
            {
              color: task.completed ? t.palette.textMuted : t.palette.text,
              textDecorationLine: task.completed ? "line-through" : "none",
            },
          ]}
        >
          {task.title}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: t.spacing.sm }}>
          <PriorityBadge priority={task.priority} />
          {task.completed ? <Pill label="Completed" icon="checkmark-circle" tint="purple" /> : null}
          {overdue ? <Pill label="Overdue" icon="alert-circle" fg={t.palette.danger} bg={t.palette.dangerMuted} /> : null}
        </View>
      </View>

      {task.description ? (
        <Card title="Notes" icon="document-text" tint="blue">
          <Text style={[t.type.body, { color: t.palette.text }]}>{task.description}</Text>
        </Card>
      ) : null}

      <Card style={{ gap: t.spacing.lg }}>
        {due ? <Meta icon="calendar" tint="slate" label="Due" value={due} danger={overdue} /> : null}
        {task.recurrence ? <Meta icon="repeat" tint="purple" label="Repeats" value={describeRecurrence(task.recurrence)} /> : null}
        {reminder ? <Meta icon="notifications" tint="amber" label="Reminder" value={reminder} /> : null}
        <Meta icon="folder" tint="blue" label="Project" value={project ? project.name : "Inbox"} />
        {tags.length > 0 ? <Meta icon="pricetag" tint="slate" label="Tags" value={tags.map((n) => `#${n}`).join(", ")} /> : null}
      </Card>

      <SubtaskList
        subtasks={task.subtasks}
        onAdd={(title) => dispatch(addSubtask(id, title))}
        onToggle={(sid) => dispatch(toggleSubtask(id, sid))}
        onEdit={(sid, title) => dispatch(editSubtask(id, sid, title))}
        onRemove={(sid) => dispatch(removeSubtask(id, sid))}
        onMove={(sid, direction) => dispatch(moveSubtask(id, sid, direction))}
      />

      <View style={{ gap: t.spacing.sm }}>
        <Button
          label={task.completed ? "Reopen task" : "Complete task"}
          icon={task.completed ? "arrow-undo" : "checkmark-circle"}
          onPress={() => toggle(id)}
        />
        {!task.completed ? (
          <Button
            label="Start focus session"
            variant="secondary"
            icon="timer-outline"
            onPress={() => router.push({ pathname: "/focus", params: { taskId: id } })}
          />
        ) : null}
        <Button
          label="Delete task"
          variant="danger"
          icon="trash-outline"
          accessibilityHint="Deletes the task. You can undo for 5 seconds."
          onPress={() => {
            remove(id);
            router.back();
          }}
        />
      </View>

      <Text style={[t.type.caption, { color: t.palette.textMuted, textAlign: "center" }]}>
        Created {stamp(created)} · Updated {stamp(updated)}
      </Text>
    </Screen>
  );
}
