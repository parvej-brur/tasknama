import { useLocalSearchParams } from "expo-router";

import { ProjectFormScreen } from "@/features/projects";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function EditProjectRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjectFormScreen id={String(id)} />;
}
