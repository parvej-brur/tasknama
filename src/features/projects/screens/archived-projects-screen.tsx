import { useRouter } from "expo-router";

import { showSnackbar } from "@/components/feedback/feedback";
import { EmptyState } from "@/components/feedback/states";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { ListRow } from "@/components/ui/list-row";
import { setProjectArchived } from "@/features/projects/actions";
import { selectArchivedProjects } from "@/features/projects/selectors";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// Archived projects can be restored from here.
export function ArchivedProjectsScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const archived = useAppSelector(selectArchivedProjects);
  const t = useTheme();

  if (archived.length === 0) {
    return (
      <EmptyState
        icon="archive-outline"
        tint="amber"
        title="No archived projects"
        message="Archived projects are hidden from lists and pickers. They show up here so you can restore them."
      />
    );
  }

  return (
    <Screen scroll>
      {archived.map((project) => (
        <ListRow
          key={project.id}
          title={project.name}
          dot={t.projectColor(project.color)}
          onPress={() => router.push({ pathname: "/project/[id]", params: { id: project.id } })}
          trailing={
            <Button
              label="Restore"
              variant="secondary"
              size="sm"
              accessibilityHint={`Restores ${project.name}`}
              onPress={() => {
                dispatch(setProjectArchived(project.id, false));
                showSnackbar({ message: `Restored “${project.name}”` });
              }}
            />
          }
        />
      ))}
    </Screen>
  );
}
