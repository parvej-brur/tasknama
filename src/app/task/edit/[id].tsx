import { useLocalSearchParams } from "expo-router";

import { TaskFormScreen } from "@/features/tasks";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function EditTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TaskFormScreen taskId={String(id)} />;
}
