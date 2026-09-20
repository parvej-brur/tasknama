import { useLocalSearchParams } from "expo-router";

import { TaskDetailScreen } from "@/features/tasks";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

// Reached from a row, a notification, or taskmanager://task/<id>.
export default function TaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TaskDetailScreen id={String(id)} />;
}
