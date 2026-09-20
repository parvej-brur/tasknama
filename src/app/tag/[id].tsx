import { useLocalSearchParams } from "expo-router";

import { TagDetailScreen } from "@/features/tags";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function TagRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TagDetailScreen id={String(id)} />;
}
