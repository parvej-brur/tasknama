import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import { LIMITS } from "@/config/limits";
import type { Subtask } from "@/features/tasks/types";
import { useTheme } from "@/theme";

type Props = {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
};

// Add, edit, complete, delete and reorder subtasks. Reordering uses up/down
// buttons, so it works without gestures and with a screen reader.
export function SubtaskList({ subtasks, onAdd, onToggle, onEdit, onRemove, onMove }: Props) {
  const t = useTheme();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const done = subtasks.filter((s) => s.completed).length;

  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  return (
    <Card
      title="Subtasks"
      icon="git-branch"
      tint="purple"
      headerRight={
        subtasks.length > 0 ? (
          <Text
            accessibilityLabel={`${done} of ${subtasks.length} subtasks done`}
            style={[
              t.type.small,
              {
                color: t.palette.primary,
                backgroundColor: t.palette.primaryMuted,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: t.radius.pill,
                overflow: "hidden",
              },
            ]}
          >
            {done} of {subtasks.length}
          </Text>
        ) : null
      }
      style={{ gap: t.spacing.md }}
    >
      {subtasks.map((subtask, index) => (
        <View
          key={subtask.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: t.palette.surfaceAlt,
            borderRadius: t.radius.md,
            paddingRight: t.spacing.xs,
          }}
        >
          <Checkbox
            checked={subtask.completed}
            onToggle={() => onToggle(subtask.id)}
            label={`${subtask.completed ? "Reopen" : "Complete"} subtask ${subtask.title}`}
            size={24}
          />
          <TextInput
            defaultValue={subtask.title}
            maxLength={LIMITS.subtaskTitleMax}
            accessibilityLabel={`Subtask ${index + 1}`}
            onEndEditing={(e) => {
              const next = e.nativeEvent.text.trim();
              if (next && next !== subtask.title) onEdit(subtask.id, next);
            }}
            style={[
              t.type.body,
              {
                flex: 1,
                minHeight: t.minTouch,
                color: subtask.completed ? t.palette.textMuted : t.palette.text,
                textDecorationLine: subtask.completed ? "line-through" : "none",
              },
            ]}
          />
          <IconButton icon="chevron-up" label={`Move ${subtask.title} up`} disabled={index === 0} onPress={() => onMove(subtask.id, -1)} color={t.palette.textMuted} size={20} />
          <IconButton icon="chevron-down" label={`Move ${subtask.title} down`} disabled={index === subtasks.length - 1} onPress={() => onMove(subtask.id, 1)} color={t.palette.textMuted} size={20} />
          <IconButton icon="trash-outline" label={`Delete subtask ${subtask.title}`} onPress={() => onRemove(subtask.id)} color={t.palette.danger} size={20} />
        </View>
      ))}

      <View style={{ flexDirection: "row", gap: t.spacing.sm, alignItems: "center" }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={LIMITS.subtaskTitleMax}
          returnKeyType="done"
          placeholder="Add a subtask"
          placeholderTextColor={t.palette.textMuted}
          accessibilityLabel="New subtask"
          style={[
            t.type.body,
            {
              flex: 1,
              minHeight: 52,
              paddingHorizontal: t.spacing.lg,
              color: t.palette.text,
              backgroundColor: focused ? t.palette.surface : t.palette.surfaceAlt,
              borderRadius: t.radius.md,
              borderWidth: 2,
              borderColor: focused ? t.palette.primary : "transparent",
            },
          ]}
        />
        <Button label="Add" variant="secondary" onPress={submit} accessibilityHint="Adds the subtask" style={{ minHeight: 52 }} />
      </View>
    </Card>
  );
}
