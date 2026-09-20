import { useRouter } from "expo-router";
import { useState } from "react";

import { showSnackbar } from "@/components/feedback/feedback";
import { NotFoundState } from "@/components/feedback/not-found";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { LIMITS } from "@/config/limits";
import { createTag, renameTag } from "@/features/tags/actions";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

// Create (no id) or rename (with id) a tag.
export function TagFormScreen({ id }: { id?: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const existing = useAppSelector((s) => (id ? s.tags.byId[id] : undefined));
  const [name, setName] = useState(existing?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  if (id && !existing) return <NotFoundState title="Tag not found" />;

  const save = () => {
    const result = existing ? dispatch(renameTag(existing.id, name)) : dispatch(createTag(name));
    if (!result.ok) return setError(result.error);
    showSnackbar({ message: existing ? "Tag renamed" : "Tag created" });
    router.back();
  };

  return (
    <Screen scroll keyboard>
      <Card>
        <TextField
          label="Tag name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          error={error}
          maxLength={LIMITS.nameMax}
          autoCapitalize="none"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
        />
      </Card>
      <Button label={existing ? "Save tag" : "Create tag"} icon="checkmark" onPress={save} />
    </Screen>
  );
}
