import { useLocalSearchParams } from "expo-router";

import { TaskFormScreen, parseDraftParam } from "@/features/tasks";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function NewTaskRoute() {
  const { draft, projectId } = useLocalSearchParams<{ draft?: string; projectId?: string }>();
  const initial = parseDraftParam(draft);
  if (typeof projectId === "string" && initial.projectId === undefined) initial.projectId = projectId;
  return <TaskFormScreen initial={initial} />;
}
