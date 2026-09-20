import { nanoid } from "@reduxjs/toolkit";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";

import { showSnackbar } from "@/components/feedback/feedback";
import { NotFoundState } from "@/components/feedback/not-found";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { LIMITS } from "@/config/limits";
import { createProject, editProject } from "@/features/projects/actions";
import { ColorPicker } from "@/features/projects/components/color-picker";
import { suggestProjectColor } from "@/features/projects/project-utils";
import { selectAllProjects } from "@/features/projects/selectors";
import type { ProjectColorId } from "@/features/projects/types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

// Create (no id) or edit (with id) a project.
export function ProjectFormScreen({ id }: { id?: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectAllProjects);
  const existing = projects.find((p) => p.id === id);
  const submitted = useRef(false);
  const newId = useRef(nanoid());

  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState<ProjectColorId>(
    existing?.color ?? suggestProjectColor(projects),
  );
  const [error, setError] = useState<string | null>(null);

  if (id && !existing) return <NotFoundState title="Project not found" />;

  const save = () => {
    if (submitted.current) return;
    const result = existing
      ? dispatch(editProject(existing.id, { name, color }))
      : dispatch(createProject(name, color, { id: newId.current }));
    if (!result.ok) return setError(result.error);
    submitted.current = true;
    showSnackbar({ message: existing ? "Project updated" : "Project created" });
    router.back();
  };

  return (
    <Screen scroll keyboard>
      <Card>
        <TextField
          label="Project name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          error={error}
          maxLength={LIMITS.nameMax}
          autoFocus={!existing}
          returnKeyType="done"
          onSubmitEditing={save}
        />
        <ColorPicker value={color} onChange={setColor} />
      </Card>
      <Button label={existing ? "Save project" : "Create project"} icon="checkmark" onPress={save} />
    </Screen>
  );
}
