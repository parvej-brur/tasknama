import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SearchField } from "@/components/ui/search-field";
import { Segmented } from "@/components/ui/segmented";
import { selectAllProjects } from "@/features/projects/selectors";
import { selectAllTags } from "@/features/tags/selectors";
import {
  DEFAULT_QUERY,
  activeFilterCount,
  type DueFilter,
  type SortKey,
  type StatusFilter,
  type TaskQuery,
} from "@/features/tasks/task-query";
import { PRIORITIES } from "@/features/tasks/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAppSelector } from "@/lib/store/hooks";
import { PRIORITY_META, useTheme } from "@/theme";

// Search input is debounced by this long before it filters the list.
export const SEARCH_DEBOUNCE_MS = 250;

export type ControlSlot = "status" | "project" | "tag" | "sort";

type Options = {
  initial?: Partial<TaskQuery>;
  // Controls that make no sense on this screen (e.g. status on Completed).
  hide?: ControlSlot[];
};

// Search + filter + sort state for a list screen. `query` is what to feed to
// `queryTasks`: its search text lags the input by 250 ms.
export function useTaskControls({ initial, hide = [] }: Options = {}) {
  const [filters, setFilters] = useState<TaskQuery>({ ...DEFAULT_QUERY, ...initial });
  const [text, setText] = useState("");
  const search = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);
  const query: TaskQuery = { ...filters, search };

  const element = (
    <TaskControls
      text={text}
      onText={setText}
      filters={filters}
      onFilters={setFilters}
      defaults={{ ...DEFAULT_QUERY, ...initial }}
      hide={hide}
    />
  );
  const defaults = { ...DEFAULT_QUERY, ...initial };
  return { query, element, isFiltering: search.trim() !== "" || activeFilterCount(query, defaults) > 0 };
}

type ControlsProps = {
  text: string;
  onText: (text: string) => void;
  filters: TaskQuery;
  onFilters: (next: TaskQuery) => void;
  defaults: TaskQuery;
  hide: ControlSlot[];
};

function TaskControls({ text, onText, filters, onFilters, defaults, hide }: ControlsProps) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters, defaults);

  return (
    <View style={{ flexDirection: "row", gap: t.spacing.sm, padding: t.spacing.lg, paddingBottom: t.spacing.md }}>
      <SearchField value={text} onChangeText={onText} />
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={count > 0 ? `Filter and sort, ${count} filters active` : "Filter and sort"}
        style={({ pressed }) => [
          {
            width: 52,
            height: 52,
            borderRadius: t.radius.lg - 2,
            backgroundColor: count > 0 ? t.palette.primary : t.palette.surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
          },
          t.shadow.card,
        ]}
      >
        <Ionicons name="options-outline" size={22} color={count > 0 ? t.palette.onPrimary : t.palette.primary} />
        {count > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              paddingHorizontal: 4,
              backgroundColor: t.palette.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={[t.type.small, { color: t.palette.onAccent, fontSize: 11, lineHeight: 14 }]}>{count}</Text>
          </View>
        ) : null}
      </Pressable>
      <FilterSheet
        visible={open}
        onClose={() => setOpen(false)}
        filters={filters}
        onFilters={onFilters}
        defaults={defaults}
        hide={hide}
      />
    </View>
  );
}

const STATUS: [StatusFilter, string][] = [["all", "All"], ["active", "Active"], ["completed", "Completed"]];
const DUE: [DueFilter, string][] = [
  ["any", "Any"],
  ["overdue", "Overdue"],
  ["today", "Today"],
  ["week", "This week"],
  ["none", "No date"],
];
const SORTS: [SortKey, string][] = [
  ["dueDate", "Due date"],
  ["priority", "Priority"],
  ["createdAt", "Created"],
  ["updatedAt", "Updated"],
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Card>
      <Text accessibilityRole="header" style={[t.type.label, { color: t.palette.text }]}>
        {title}
      </Text>
      {children}
    </Card>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>{children}</View>;
}

function FilterSheet({
  visible,
  onClose,
  filters,
  onFilters,
  defaults,
  hide,
}: Omit<ControlsProps, "text" | "onText"> & { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const projects = useAppSelector(selectAllProjects);
  const tags = useAppSelector(selectAllTags);
  const set = (patch: Partial<TaskQuery>) => onFilters({ ...filters, ...patch });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.palette.background }} accessibilityViewIsModal>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: t.spacing.lg,
            paddingTop: t.spacing.lg,
            paddingBottom: t.spacing.sm,
          }}
        >
          <Text accessibilityRole="header" style={[t.type.title, { color: t.palette.text }]}>
            Filter and sort
          </Text>
          <Button label="Done" size="sm" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md, paddingBottom: t.spacing.xxl * 2 }}>
          {!hide.includes("status") ? (
            <Group title="Status">
              <Segmented
                label="Status"
                value={filters.status}
                onChange={(status) => set({ status })}
                options={STATUS.map(([value, label]) => ({ value, label }))}
              />
            </Group>
          ) : null}
          <Group title="Priority">
            <Wrap>
              <Chip label="Any" selected={filters.priority === null} onPress={() => set({ priority: null })} />
              {[...PRIORITIES].reverse().map((p) => (
                <Chip
                  key={p}
                  label={PRIORITY_META[p].label}
                  icon={PRIORITY_META[p].icon}
                  selected={filters.priority === p}
                  onPress={() => set({ priority: p })}
                />
              ))}
            </Wrap>
          </Group>
          <Group title="Due date">
            <Wrap>
              {DUE.map(([value, label]) => (
                <Chip key={value} label={label} selected={filters.due === value} onPress={() => set({ due: value })} />
              ))}
            </Wrap>
          </Group>
          {!hide.includes("project") && projects.length > 0 ? (
            <Group title="Project">
              <Wrap>
                <Chip label="Any" selected={filters.projectId === null} onPress={() => set({ projectId: null })} />
                {projects.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    dot={t.projectColor(p.color)}
                    selected={filters.projectId === p.id}
                    onPress={() => set({ projectId: p.id })}
                  />
                ))}
              </Wrap>
            </Group>
          ) : null}
          {!hide.includes("tag") && tags.length > 0 ? (
            <Group title="Tag">
              <Wrap>
                <Chip label="Any" selected={filters.tagId === null} onPress={() => set({ tagId: null })} />
                {tags.map((tag) => (
                  <Chip key={tag.id} label={`#${tag.name}`} selected={filters.tagId === tag.id} onPress={() => set({ tagId: tag.id })} />
                ))}
              </Wrap>
            </Group>
          ) : null}
          {!hide.includes("sort") ? (
            <>
              <Group title="Sort by">
                <Wrap>
                  {SORTS.map(([value, label]) => (
                    <Chip key={value} label={label} selected={filters.sortKey === value} onPress={() => set({ sortKey: value })} />
                  ))}
                </Wrap>
              </Group>
              <Group title="Order">
                <Segmented
                  label="Order"
                  value={filters.sortDir}
                  onChange={(sortDir) => set({ sortDir })}
                  options={[
                    { value: "asc", label: "Ascending", icon: "arrow-up" },
                    { value: "desc", label: "Descending", icon: "arrow-down" },
                  ]}
                />
              </Group>
            </>
          ) : null}
          <Button label="Reset filters" variant="secondary" icon="refresh" onPress={() => onFilters({ ...defaults })} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
