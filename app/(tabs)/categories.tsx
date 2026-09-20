import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Colors, suggestCategoryColor } from "@/components/colors";
import { ColorSwatchPicker } from "@/components/customs/ColorSwatchPicker";
import { EmptyList } from "@/components/EmptyList";
import { AppFonts } from "@/components/fonts";
import { CategoryListItem } from "@/components/Lists/CategoryListItem";
import { useTasks } from "@/contexts/TasksProvider";
import { common } from "@/styles/common";
import { Radius, Spacing } from "@/styles/layout";
import type { Category, CategoryColorId } from "@/types/task";

export default function CategoriesScreen() {
  const { categories, tasks, createCategory, deleteCategory } = useTasks();
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColorId>(() =>
    suggestCategoryColor(categories),
  );
  const [submitting, setSubmitting] = useState(false);

  const taskCounts: Record<string, number> = {};
  for (const task of tasks) {
    if (task.categoryId) {
      taskCounts[task.categoryId] = (taskCounts[task.categoryId] ?? 0) + 1;
    }
  }

  const trimmed = name.trim();
  const canAdd = trimmed.length > 0 && !submitting;

  async function handleAdd() {
    if (trimmed.length === 0) return;

    const exists = categories.some(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      Toast.show({ type: "error", text1: "That category already exists" });
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCategory({ name: trimmed, color });
      setName("");
      setColor(suggestCategoryColor([...categories, created]));
      Toast.show({ type: "success", text1: "Category added" });
    } catch {
      Toast.show({ type: "error", text1: "Couldn’t add category" });
    } finally {
      setSubmitting(false);
    }
  }

  function handlePressCategory(category: Category) {
    router.push({ pathname: "/category/[id]", params: { id: category.id } });
  }

  function handleDeleteCategory(category: Category) {
    const count = taskCounts[category.id] ?? 0;
    const message =
      count > 0
        ? `Delete “${category.name}”? ${count} task${count === 1 ? "" : "s"} will become uncategorised.`
        : `Delete “${category.name}”? This can’t be undone.`;

    Alert.alert("Delete category", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCategory(category.id);
            Toast.show({ type: "success", text1: "Category deleted" });
          } catch {
            Toast.show({ type: "error", text1: "Couldn’t delete category" });
          }
        },
      },
    ]);
  }

  function renderItem({ item }: { item: Category }) {
    return (
      <CategoryListItem
        category={item}
        taskCount={taskCounts[item.id] ?? 0}
        onPress={handlePressCategory}
        onDelete={handleDeleteCategory}
      />
    );
  }

  return (
    <SafeAreaView style={common.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{categories.length} in use</Text>
        <Text style={styles.title}>Categories</Text>
      </View>

      <View style={styles.addRow}>
        <View style={styles.inputWrap}>
          <Ionicons
            name="pricetag-outline"
            size={18}
            color={Colors.textSubtle}
          />
          <TextInput
            style={styles.input}
            placeholder="New category name"
            placeholderTextColor={Colors.textSubtle}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            accessibilityLabel="New category name"
          />
        </View>
        <Pressable
          onPress={handleAdd}
          disabled={!canAdd}
          accessibilityRole="button"
          accessibilityLabel="Add category"
          style={({ pressed }) => [
            styles.addButton,
            !canAdd && styles.addButtonDisabled,
            pressed && canAdd && styles.addButtonPressed,
          ]}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.colorRow}>
        <Text style={styles.colorLabel}>Colour</Text>
        <ColorSwatchPicker value={color} onChange={setColor} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ListSeparator}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyList
            icon="pricetags-outline"
            title="No categories yet"
            message="Add a category above to organise your tasks."
          />
        }
      />
    </SafeAreaView>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: 2,
  },
  eyebrow: {
    fontFamily: AppFonts.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  title: {
    fontFamily: AppFonts.headingBold,
    fontSize: 26,
    color: Colors.text,
    letterSpacing: 0.2,
  },
  addRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  colorLabel: {
    fontFamily: AppFonts.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    height: 50,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontFamily: AppFonts.body,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: Colors.borderStrong,
  },
  addButtonPressed: {
    opacity: 0.88,
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.sm,
  },
});
