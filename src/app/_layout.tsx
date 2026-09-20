import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { RouteError } from "@/components/feedback/route-error";
import { SnackbarHost } from "@/components/feedback/snackbar-host";
import { IconButton } from "@/components/ui/icon-button";
import { NotificationRouter } from "@/features/notifications";
import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { AppProviders } from "@/providers/app-providers";
import { useTheme } from "@/theme";

export const unstable_settings = { anchor: "(tabs)" };

// Root error boundary: anything a route doesn't catch lands here.
export { RouteError as ErrorBoundary };

function CloseButton() {
  const t = useTheme();
  const router = useRouter();
  return <IconButton icon="close" label="Close" color={t.palette.text} onPress={() => router.back()} />;
}

function RootNavigator() {
  const t = useTheme();
  const reduceMotion = useReduceMotion();

  const modal = (title: string) => ({
    title,
    presentation: "modal" as const,
    headerLeft: () => <CloseButton />,
  });

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.palette.background },
          headerShadowVisible: false,
          headerTintColor: t.palette.primary,
          headerTitleStyle: { fontFamily: t.fonts.heading, fontSize: 18, color: t.palette.text },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: t.palette.background },
          animation: reduceMotion ? "none" : "default",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task/[id]" options={{ title: "Task" }} />
        <Stack.Screen name="task/new" options={modal("New task")} />
        <Stack.Screen name="task/edit/[id]" options={modal("Edit task")} />
        <Stack.Screen name="quick-add" options={modal("Quick add")} />
        <Stack.Screen name="completed" options={{ title: "Completed" }} />
        <Stack.Screen name="tasks/all" options={{ title: "All tasks" }} />
        <Stack.Screen name="project/[id]" options={{ title: "Project" }} />
        <Stack.Screen name="project/new" options={modal("New project")} />
        <Stack.Screen name="project/edit/[id]" options={modal("Edit project")} />
        <Stack.Screen name="projects/archived" options={{ title: "Archived projects" }} />
        <Stack.Screen name="tags" options={{ title: "Tags" }} />
        <Stack.Screen name="tag/[id]" options={{ title: "Tag" }} />
        <Stack.Screen name="tag/new" options={modal("New tag")} />
        <Stack.Screen name="tag/edit/[id]" options={modal("Rename tag")} />
        <Stack.Screen name="focus" options={{ title: "Focus" }} />
        <Stack.Screen name="productivity" options={{ title: "Productivity" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
      <NotificationRouter />
      <SnackbarHost />
      <StatusBar style={t.scheme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
