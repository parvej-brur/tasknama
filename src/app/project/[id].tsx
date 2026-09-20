import { useLocalSearchParams } from "expo-router";

import { ProjectDetailScreen } from "@/features/projects";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function ProjectRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjectDetailScreen id={String(id)} />;
}
