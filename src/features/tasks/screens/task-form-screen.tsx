import { nanoid } from "@reduxjs/toolkit";
import { Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";

import { announce, showSnackbar } from "@/components/feedback/feedback";
import { NotFoundState } from "@/components/feedback/not-found";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateField, TimeField } from "@/components/ui/date-fields";
import { TextField } from "@/components/ui/text-field";
import { LIMITS } from "@/config/limits";
import { ReminderField } from "@/features/notifications/components/reminder-field";
import { createTask, updateTask } from "@/features/tasks/actions";
import {
  PriorityPicker,
  ProjectPicker,
  TagPicker,
} from "@/features/tasks/components/field-pickers";
import { RecurrenceField } from "@/features/tasks/components/recurrence-field";
import { SubtaskList } from "@/features/tasks/components/subtask-list";
import type { TaskErrors } from "@/features/tasks/schemas";
import { EMPTY_TASK_INPUT, type Subtask, type TaskInput } from "@/features/tasks/types";
import { useClock } from "@/hooks/use-clock";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

type Props = {
  // Present when editing.
  taskId?: string;
  // Prefill for a new task (quick add, a project's + button).
  initial?: Partial<TaskInput>;
};

export function TaskFormScreen({ taskId, initial }: Props) {
  const existing = useAppSelector((s) => (taskId ? s.tasks.byId[taskId] : undefined));
  if (taskId && !existing) {
    return <NotFoundState title="Task not found" message="This task doesn’t exist any more." />;
  }
  return <TaskForm key={taskId ?? "new"} taskId={taskId} initial={initial} />;
}

function TaskForm({ taskId, initial }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { today } = useClock();
  const existing = useAppSelector((s) => (taskId ? s.tasks.byId[taskId] : undefined));

  const [draft, setDraft] = useState<TaskInput>(() =>
    existing
      ? {
          title: existing.title,
          description: existing.description,
          priority: existing.priority,
          dueDate: existing.dueDate,
          dueTime: existing.dueTime,
          projectId: existing.projectId,
          tagIds: existing.tagIds,
          subtasks: existing.subtasks,
          reminder: existing.reminder,
          recurrence: existing.recurrence,
        }
      : { ...EMPTY_TASK_INPUT, ...initial },
  );
  const [errors, setErrors] = useState<TaskErrors>({});

  // A new task keeps one id for the life of the form, so a second tap on Save
  // can't create a duplicate. The ref also blocks re-entry while navigating away.
  const newId = useRef(nanoid());
  const submitted = useRef(false);

  const clearErrors = (...fields: (keyof TaskErrors)[]) =>
    setErrors((e) => {
      const next = { ...e };
      for (const field of fields) delete next[field];
      return next;
    });

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    const field = ERROR_FIELD[key];
    if (field) clearErrors(field);
  };

  const setDueDate = (dueDate: string | null) => {
    clearErrors("dueDate", "dueTime", "recurrence", "reminder");
    setDraft((d) => ({
      ...d,
      dueDate,
      // Time, repeat and relative reminders all depend on a date.
      dueTime: dueDate ? d.dueTime : null,
      recurrence: dueDate ? d.recurrence : null,
      reminder: dueDate || d.reminder?.kind !== "preset" ? d.reminder : null,
    }));
  };

  const updateSubtasks = (fn: (list: Subtask[]) => Subtask[]) =>
    setDraft((d) => ({ ...d, subtasks: fn(d.subtasks) }));

  const submit = () => {
    if (submitted.current) return;
    const result = existing
      ? dispatch(updateTask(existing.id, draft))
      : dispatch(createTask(draft, { id: newId.current }));
    if (!result.ok) {
      setErrors(result.errors);
      const first = Object.values(result.errors)[0];
      if (first) announce(first);
      return;
    }
    submitted.current = true;
    showSnackbar({ message: existing ? "Task updated" : "Task added" });
    router.back();
  };

  return (
    <Screen scroll keyboard>
      {
        // Always in reach, however far the form is scrolled.
      }
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button label={existing ? "Save" : "Add"} variant="ghost" size="sm" onPress={submit} />
          ),
        }}
      />
      <Card title="Details" icon="create" tint="blue">
        <TextField
          label="Title"
          value={draft.title}
          onChangeText={(text) => set("title", text)}
          error={errors.title}
          maxLength={LIMITS.titleMax}
          autoFocus={!existing}
          returnKeyType="next"
        />
        <TextField
          label="Description"
          value={draft.description}
          onChangeText={(text) => set("description", text)}
          error={errors.description}
          maxLength={LIMITS.descriptionMax}
          multiline
        />
      </Card>

      <Card title="Schedule" icon="calendar" tint="slate">
        <DateField value={draft.dueDate} onChange={setDueDate} error={errors.dueDate} today={today} />
        <TimeField
          value={draft.dueTime}
          onChange={(v) => set("dueTime", v)}
          error={errors.dueTime}
          disabled={draft.dueDate === null}
        />
        <RecurrenceField
          value={draft.recurrence}
          onChange={(v) => set("recurrence", v)}
          dueDate={draft.dueDate}
          error={errors.recurrence}
        />
        <ReminderField
          value={draft.reminder}
          onChange={(v) => set("reminder", v)}
          hasDueDate={draft.dueDate !== null}
          today={today}
          error={errors.reminder}
        />
      </Card>

      <Card title="Organise" icon="folder-open" tint="amber">
        <PriorityPicker value={draft.priority} onChange={(v) => set("priority", v)} />
        <ProjectPicker value={draft.projectId} onChange={(v) => set("projectId", v)} error={errors.project} />
        <TagPicker value={draft.tagIds} onChange={(v) => set("tagIds", v)} error={errors.tags} />
      </Card>

      <SubtaskList
        subtasks={draft.subtasks}
        onAdd={(title) =>
          updateSubtasks((list) => [...list, { id: nanoid(), title: title.trim(), completed: false }])
        }
        onToggle={(id) =>
          updateSubtasks((list) => list.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)))
        }
        onEdit={(id, title) =>
          updateSubtasks((list) => list.map((s) => (s.id === id ? { ...s, title } : s)))
        }
        onRemove={(id) => updateSubtasks((list) => list.filter((s) => s.id !== id))}
        onMove={(id, direction) =>
          updateSubtasks((list) => {
            const from = list.findIndex((s) => s.id === id);
            const to = from + direction;
            if (from < 0 || to < 0 || to >= list.length) return list;
            const next = [...list];
            [next[from], next[to]] = [next[to], next[from]];
            return next;
          })
        }
      />

      <Button label={existing ? "Save changes" : "Add task"} icon="checkmark" onPress={submit} />
    </Screen>
  );
}

// Which validation error belongs to which draft field.
const ERROR_FIELD: Partial<Record<keyof TaskInput, keyof TaskErrors>> = {
  title: "title",
  description: "description",
  dueDate: "dueDate",
  dueTime: "dueTime",
  recurrence: "recurrence",
  reminder: "reminder",
  projectId: "project",
  tagIds: "tags",
};
