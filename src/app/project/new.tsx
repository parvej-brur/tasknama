import { ProjectFormScreen } from "@/features/projects";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function NewProjectRoute() {
  return <ProjectFormScreen />;
}
