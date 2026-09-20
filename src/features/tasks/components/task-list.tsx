import { FlashList } from "@shopify/flash-list";
import { useCallback, useState } from "react";
import { RefreshControl, View } from "react-native";

import { SectionHeader } from "@/components/layout/section-header";
import { useTaskActions } from "@/features/tasks/hooks/use-task-actions";
import { isOverdue, type TaskGroup } from "@/features/tasks/task-views";
import type { Task } from "@/features/tasks/types";
import { useTheme } from "@/theme";
import { formatDayRelative, type Clock } from "@/utils/date";

import { TaskRow } from "./task-row";

export type ListItem =
  | { kind: "header"; key: string; title: string; count?: number; tone?: "default" | "danger" | "highlight" }
  | { kind: "task"; key: string; task: Task; overdue: boolean };

export type Section = {
  key: string;
  title: string;
  tone?: "default" | "danger" | "highlight";
  tasks: Task[];
  // Hide the header (single flat list).
  bare?: boolean;
};

// Flattens sections into one list so FlashList can virtualize across them.
export function sectionsToItems(sections: Section[], clock: Clock): ListItem[] {
  const items: ListItem[] = [];
  for (const section of sections) {
    if (section.tasks.length === 0) continue;
    if (!section.bare) {
      items.push({
        kind: "header",
        key: `h:${section.key}`,
        title: section.title,
        count: section.tasks.length,
        tone: section.tone,
      });
    }
    for (const task of section.tasks) {
      items.push({ kind: "task", key: task.id, task, overdue: isOverdue(task, clock) });
    }
  }
  return items;
}

// Date-keyed groups (Upcoming, Completed) become titled sections.
export function groupsToSections(groups: TaskGroup[], today: string): Section[] {
  return groups.map((g) => ({
    key: g.key,
    title:
      g.key === "unknown" ? "Earlier" : g.key === "none" ? "No date" : formatDayRelative(g.key, today),
    tasks: g.tasks,
  }));
}

type Props = {
  items: ListItem[];
  today: string;
  header?: React.ReactElement | null;
  empty?: React.ReactElement | null;
  // Pull to refresh. Local data is always fresh, so this re-syncs reminders.
  onRefresh?: () => void | Promise<void>;
};

export function TaskList({ items, today, header, empty, onRefresh }: Props) {
  const t = useTheme();
  const { open, toggle, remove } = useTaskActions();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      // Brief spinner so the gesture reads as acknowledged.
      setTimeout(() => setRefreshing(false), 350);
    }
  }, [onRefresh]);

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.key}
      getItemType={(item) => item.kind}
      extraData={today}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={{ paddingBottom: 132, backgroundColor: t.palette.background }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.palette.primary} />
        ) : undefined
      }
      renderItem={({ item }) =>
        item.kind === "header" ? (
          <View style={{ paddingHorizontal: t.spacing.lg }}>
            <SectionHeader title={item.title} count={item.count} tone={item.tone} />
          </View>
        ) : (
          <TaskRow
            task={item.task}
            today={today}
            overdue={item.overdue}
            onOpen={open}
            onToggle={toggle}
            onDelete={remove}
          />
        )
      }
    />
  );
}
