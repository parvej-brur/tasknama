import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { showSnackbar } from "@/components/feedback/feedback";
import { EmptyState } from "@/components/feedback/states";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { TextField } from "@/components/ui/text-field";
import { LIMITS } from "@/config/limits";
import { createTag } from "@/features/tags/actions";
import { selectAllTags, selectTagCounts } from "@/features/tags/selectors";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

// All tags, with a quick way to add one.
export function TagsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tags = useAppSelector(selectAllTags);
  const counts = useAppSelector(selectTagCounts);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const result = dispatch(createTag(name));
    if (!result.ok) return setError(result.error);
    setName("");
    setError(null);
    showSnackbar({ message: "Tag created" });
  };

  return (
    <Screen scroll keyboard>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextField
              label="New tag"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              error={error}
              maxLength={LIMITS.nameMax}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={add}
            />
          </View>
          {
            // Lines up with the input: the field's label is 18 pt tall plus an 8 pt gap.
          }
          <Button label="Add" onPress={add} style={{ marginTop: 26, minHeight: 52 }} />
        </View>
      </Card>
      {tags.length === 0 ? (
        <EmptyState icon="pricetags-outline" tint="slate" title="No tags yet" message="Tags let you slice tasks across projects." />
      ) : (
        <View style={{ gap: 12 }}>
          {tags.map((tag) => (
            <ListRow
              key={tag.id}
              icon="pricetag"
              tint="slate"
              title={`#${tag.name}`}
              subtitle={`${counts[tag.id] ?? 0} tasks`}
              onPress={() => router.push({ pathname: "/tag/[id]", params: { id: tag.id } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
