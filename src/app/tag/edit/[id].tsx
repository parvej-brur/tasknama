import { useLocalSearchParams } from "expo-router";

import { TagFormScreen } from "@/features/tags";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

export default function EditTagRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TagFormScreen id={String(id)} />;
}
