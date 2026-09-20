import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FieldLabel } from "@/components/ui/field-label";
import { Segmented } from "@/components/ui/segmented";
import { TextField } from "@/components/ui/text-field";
import { selectActiveProjects } from "@/features/projects/selectors";
import { createTag } from "@/features/tags/actions";
import { selectAllTags } from "@/features/tags/selectors";
import { PRIORITIES, type Priority } from "@/features/tasks/types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { PRIORITY_META, priorityColor, useTheme } from "@/theme";

export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (value: Priority) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.sm }}>
      <FieldLabel label="Priority" />
      <Segmented
        label="Priority"
        value={value}
        onChange={onChange}
        options={[...PRIORITIES].reverse().map((priority) => ({
          value: priority,
          label: PRIORITY_META[priority].label,
          icon: PRIORITY_META[priority].icon,
          color: priorityColor(priority, t.palette),
          accessibilityLabel: `${PRIORITY_META[priority].label} priority`,
        }))}
      />
    </View>
  );
}

// Pick a project, or none (the task lands in Inbox). Archived projects aren't offered.
export function ProjectPicker({
  value,
  onChange,
  error,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string | null;
}) {
  const t = useTheme();
  const projects = useAppSelector(selectActiveProjects);
  // Keep showing the current project even if it was archived after being chosen.
  const current = useAppSelector((s) => (value ? s.projects.byId[value] : undefined));
  const shown = current && current.archived ? [...projects, current] : projects;

  return (
    <View style={{ gap: t.spacing.sm }}>
      <FieldLabel label="Project" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
        <Chip label="Inbox (no project)" icon="file-tray-outline" selected={value === null} onPress={() => onChange(null)} />
        {shown.map((project) => (
          <Chip
            key={project.id}
            label={project.archived ? `${project.name} (archived)` : project.name}
            dot={t.projectColor(project.color)}
            selected={value === project.id}
            onPress={() => onChange(project.id)}
          />
        ))}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[t.type.caption, { color: t.palette.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// Many tags per task, with inline creation of a new one.
export function TagPicker({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string | null;
}) {
  const t = useTheme();
  const dispatch = useAppDispatch();
  const tags = useAppSelector(selectAllTags);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  const add = () => {
    if (!draft.trim()) return;
    const result = dispatch(createTag(draft));
    if (result.ok) {
      onChange([...value, result.id]);
      setDraft("");
      setDraftError(null);
    } else {
      setDraftError(result.error);
    }
  };

  return (
    <View style={{ gap: t.spacing.md }}>
      <FieldLabel label="Tags" />
      {tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
          {tags.map((tag) => {
            const on = value.includes(tag.id);
            return (
              <Chip
                key={tag.id}
                label={`#${tag.name}`}
                selected={on}
                onPress={() => onChange(on ? value.filter((id) => id !== tag.id) : [...value, tag.id])}
                accessibilityLabel={`Tag ${tag.name}`}
              />
            );
          })}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField
            label="New tag"
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              setDraftError(null);
            }}
            error={draftError}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={add}
          />
        </View>
        {
          // Lines up with the input: the field's label is 18 pt tall plus an 8 pt gap.
        }
        <Button label="Add" variant="secondary" onPress={add} accessibilityHint="Adds the tag" style={{ marginTop: 26, minHeight: 52 }} />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[t.type.caption, { color: t.palette.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
