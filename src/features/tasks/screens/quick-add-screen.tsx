import { nanoid } from "@reduxjs/toolkit";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

import { announce, showSnackbar } from "@/components/feedback/feedback";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { IconTile } from "@/components/ui/icon-tile";
import { TextField } from "@/components/ui/text-field";
import { createTag } from "@/features/tags/actions";
import { selectAllTags } from "@/features/tags/selectors";
import { createTaskFromQuickAdd } from "@/features/tasks/actions";
import {
  parseQuickAdd,
  type QuickAddDisabled,
  type QuickAddPart,
} from "@/features/tasks/quick-add";
import { describeRecurrence } from "@/features/tasks/recurrence";
import type { TaskInput } from "@/features/tasks/types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { PRIORITY_META, priorityColor, useTheme } from "@/theme";
import { formatDayRelative, formatTime, toDateKey } from "@/utils/date";

// One text box, with a live preview of what will be created. Every parsed
// piece is a chip that can be removed before saving; removing it puts the
// words back into the title.
export function QuickAddScreen() {
  const t = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tags = useAppSelector(selectAllTags);
  const [text, setText] = useState("");
  const [disabled, setDisabled] = useState<Set<QuickAddPart | `tag:${string}`>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const id = useRef(nanoid());
  const submitted = useRef(false);

  const now = new Date();
  const today = toDateKey(now);
  // Re-parsed on every change; parsing is local and cheap.
  const parsed = useMemo(
    () => parseQuickAdd(text, { now: new Date(), existingTags: tags, disabled: disabled as QuickAddDisabled }),
    [text, tags, disabled],
  );

  const off = (part: QuickAddPart | `tag:${string}`) => {
    setDisabled((d) => new Set(d).add(part));
    announce("Removed from the new task");
  };

  const update = (value: string) => {
    setText(value);
    setError(null);
    // Clearing the box starts over; otherwise removed chips stay removed.
    if (value === "") setDisabled(new Set());
  };

  const save = () => {
    if (submitted.current) return;
    const result = dispatch(createTaskFromQuickAdd(parsed, { id: id.current }));
    if (!result.ok) {
      setError(result.errors.title ?? "Couldn’t add this task.");
      return;
    }
    submitted.current = true;
    showSnackbar({ message: `Added “${parsed.title}”` });
    router.back();
  };

  const openFullForm = () => {
    if (submitted.current) return;
    // New tags are created now so the form can refer to them by id.
    const tagIds: string[] = [];
    for (const tag of parsed.tags) {
      if (tag.existingId) tagIds.push(tag.existingId);
      else {
        const created = dispatch(createTag(tag.name));
        if (created.ok) tagIds.push(created.id);
      }
    }
    const draft: Partial<TaskInput> = {
      title: parsed.title,
      priority: parsed.priority ?? "medium",
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      tagIds,
      recurrence: parsed.recurrence,
    };
    router.replace({ pathname: "/task/new", params: { draft: JSON.stringify(draft) } });
  };

  const hasContent = text.trim().length > 0;

  return (
    <Screen scroll keyboard>
      <Card>
        <TextField
          label="Describe your task"
          value={text}
          onChangeText={update}
          autoFocus
          multiline
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={save}
          placeholder="Prepare slides tomorrow at 7 PM, high priority #work"
          hint="Type a task with an optional date, time, priority and tags"
          accessibilityHint="Type a task with an optional date, time, priority and tags"
          error={error}
        />
      </Card>

      {hasContent ? (
        <Card title="Preview" subtitle="Tap ✕ on a piece to put its words back in the title" icon="eye" tint="slate">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm, alignItems: "center" }} accessibilityLiveRegion="polite">
            <Chip
              icon="text"
              label={parsed.title ? `Title: ${parsed.title}` : "Title: (add a title)"}
              color={parsed.title ? undefined : t.palette.danger}
            />
            {parsed.dueDate ? (
              <Chip
                icon="calendar-outline"
                label={`Date: ${formatDayRelative(parsed.dueDate, today)}`}
                onRemove={() => off("date")}
                removeLabel="Remove date"
              />
            ) : null}
            {parsed.dueTime ? (
              <Chip
                icon="time-outline"
                label={`Time: ${formatTime(parsed.dueTime)}`}
                onRemove={() => off("time")}
                removeLabel="Remove time"
              />
            ) : null}
            {parsed.priority ? (
              <Chip
                icon={PRIORITY_META[parsed.priority].icon}
                color={priorityColor(parsed.priority, t.palette)}
                label={`Priority: ${PRIORITY_META[parsed.priority].label}`}
                onRemove={() => off("priority")}
                removeLabel="Remove priority"
              />
            ) : null}
            {parsed.recurrence ? (
              <Chip
                icon="repeat"
                label={describeRecurrence(parsed.recurrence)}
                onRemove={() => off("recurrence")}
                removeLabel="Remove repeat"
              />
            ) : null}
            {parsed.tags.map((tag) => (
              <Chip
                key={tag.name}
                icon="pricetag-outline"
                label={`#${tag.name}`}
                badge={tag.existingId ? undefined : "new"}
                onRemove={() => off(`tag:${tag.name.toLowerCase()}`)}
                removeLabel={`Remove tag ${tag.name}`}
              />
            ))}
          </View>
        </Card>
      ) : (
        <View
          style={{
            flexDirection: "row",
            gap: t.spacing.md,
            padding: t.spacing.lg,
            borderRadius: t.radius.lg,
            backgroundColor: t.palette.tints.amber.bg,
          }}
        >
          <IconTile icon="bulb" tint="amber" size={40} />
          <Text style={[t.type.caption, { flex: 1, color: t.palette.text }]}>
            Try “Call Sam tomorrow at 9am p1 #work”, “Water plants every Monday”, or “Submit report Friday 5pm !high”.
          </Text>
        </View>
      )}

      <View style={{ gap: t.spacing.md }}>
        <Button label="Add task" icon="checkmark" onPress={save} disabled={!hasContent} />
        <Button label="Open full form" variant="secondary" icon="create-outline" onPress={openFullForm} disabled={!hasContent} />
      </View>
    </Screen>
  );
}
