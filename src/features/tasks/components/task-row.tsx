import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import { Checkbox } from "@/components/ui/checkbox";
import { Pill } from "@/components/ui/pill";
import { taskA11yLabel } from "@/features/tasks/accessibility";
import { subtaskProgress } from "@/features/tasks/task-views";
import type { Task } from "@/features/tasks/types";
import { useAppSelector } from "@/lib/store/hooks";
import { readableOn, useTheme } from "@/theme";
import { formatDueLabel } from "@/utils/date";

import { PriorityBadge } from "./priority-badge";

type Props = {
  task: Task;
  // Today's date key; only used for wording, so rows don't re-render each minute.
  today: string;
  overdue: boolean;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

const ACTION_WIDTH = 96;

// Memoized on purpose: this is the one component every list repeats, and the
// props are all primitives, the task record, or stable callbacks.
export const TaskRow = memo(function TaskRow({
  task,
  today,
  overdue,
  onOpen,
  onToggle,
  onDelete,
}: Props) {
  const t = useTheme();
  const p = t.palette;
  const swipeRef = useRef<SwipeableMethods>(null);

  // Narrow selectors: a row only re-renders when its own project or tag names change.
  const project = useAppSelector((s) => (task.projectId ? s.projects.byId[task.projectId] : undefined));
  const tagNames = useAppSelector((s) =>
    task.tagIds.map((id) => s.tags.byId[id]?.name ?? "").filter(Boolean).join("\u0000"),
  );
  const tags = tagNames ? tagNames.split("\u0000") : [];

  const due = formatDueLabel(task.dueDate, task.dueTime, today);
  const dueToday = !task.completed && task.dueDate === today;
  const { done, total } = subtaskProgress(task);
  const toggleLabel = task.completed ? "Reopen" : "Complete";

  const renderAction = (side: "left" | "right") => {
    const isComplete = side === "left";
    const bg = isComplete ? p.primary : p.danger;
    const ink = readableOn(bg);
    return (
      <View
        style={{
          width: ACTION_WIDTH,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          backgroundColor: bg,
        }}
      >
        <Ionicons
          name={isComplete ? (task.completed ? "arrow-undo" : "checkmark-circle") : "trash"}
          size={24}
          color={ink}
        />
        <Text style={[t.type.small, { color: ink }]}>{isComplete ? toggleLabel : "Delete"}</Text>
      </View>
    );
  };

  const dueTint = overdue
    ? { fg: p.danger, bg: p.dangerMuted }
    : dueToday
      ? p.highlight
      : undefined;

  return (
    // The outer view carries the shadow; the inner one clips the swipe actions to the rounded corners.
    <View
      style={[
        {
          marginHorizontal: t.spacing.lg,
          marginBottom: t.spacing.md,
          borderRadius: t.radius.lg,
          backgroundColor: p.surface,
          borderWidth: t.scheme === "dark" ? 1 : 0,
          borderColor: p.border,
        },
        t.shadow.card,
      ]}
    >
      <View style={{ borderRadius: t.radius.lg, overflow: "hidden" }}>
        <ReanimatedSwipeable
          ref={swipeRef}
          // Swipe right reveals the left action (complete); swipe left reveals delete.
          renderLeftActions={() => renderAction("left")}
          renderRightActions={() => renderAction("right")}
          leftThreshold={ACTION_WIDTH * 0.8}
          rightThreshold={ACTION_WIDTH * 0.8}
          overshootLeft={false}
          overshootRight={false}
          onSwipeableOpen={(direction) => {
            swipeRef.current?.close();
            if (direction === "left") onToggle(task.id);
            else onDelete(task.id);
          }}
        >
          <Pressable
            onPress={() => onOpen(task.id)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={taskA11yLabel(task, today, overdue)}
            accessibilityHint="Opens task details"
            accessibilityActions={[
              { name: "toggle", label: toggleLabel },
              { name: "delete", label: "Delete" },
            ]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === "toggle") onToggle(task.id);
              else if (event.nativeEvent.actionName === "delete") onDelete(task.id);
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "flex-start",
              minHeight: 72,
              paddingVertical: t.spacing.sm + 2,
              paddingLeft: t.spacing.xs,
              paddingRight: t.spacing.lg,
              backgroundColor: pressed ? p.surfaceAlt : p.surface,
            })}
          >
            <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Checkbox
                checked={task.completed}
                onToggle={() => onToggle(task.id)}
                label={`${toggleLabel} ${task.title}`}
                ringColor={task.priority === "high" && !task.completed ? p.danger : undefined}
              />
            </View>
            <View style={{ flex: 1, gap: t.spacing.sm, paddingTop: 10 }}>
              <Text
                numberOfLines={2}
                style={[
                  t.type.bodyStrong,
                  {
                    color: task.completed ? p.textMuted : p.text,
                    textDecorationLine: task.completed ? "line-through" : "none",
                  },
                ]}
              >
                {task.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 6 }}>
                {due ? (
                  <Pill
                    label={due}
                    icon={task.recurrence ? "repeat" : overdue ? "alert-circle" : "calendar-outline"}
                    fg={dueTint?.fg}
                    bg={dueTint?.bg}
                  />
                ) : null}
                {
                  // Medium is the default, so it is left unmarked; the row's spoken label still includes it.
                }
                {task.priority !== "medium" ? <PriorityBadge priority={task.priority} /> : null}
                {total > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="git-branch-outline" size={14} color={p.textMuted} />
                    <Text style={[t.type.caption, { color: p.textMuted }]}>
                      {done}/{total}
                    </Text>
                  </View>
                ) : null}
                {task.reminder ? <Ionicons name="notifications-outline" size={14} color={p.textMuted} /> : null}
                {project ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, maxWidth: 150 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.projectColor(project.color) }} />
                    <Text numberOfLines={1} style={[t.type.caption, { color: p.textMuted, flexShrink: 1 }]}>
                      {project.name}
                    </Text>
                  </View>
                ) : null}
                {tags.slice(0, 2).map((name) => (
                  <Text key={name} numberOfLines={1} style={[t.type.label, { color: p.primary, maxWidth: 110 }]}>
                    #{name}
                  </Text>
                ))}
                {tags.length > 2 ? (
                  <Text style={[t.type.caption, { color: p.textMuted }]}>+{tags.length - 2}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        </ReanimatedSwipeable>
      </View>
    </View>
  );
});
