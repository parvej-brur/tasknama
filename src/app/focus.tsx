import { useLocalSearchParams } from "expo-router";

import { FocusScreen } from "@/features/focus";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function FocusRoute() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  return <FocusScreen taskId={typeof taskId === "string" ? taskId : undefined} />;
}
