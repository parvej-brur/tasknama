import { useRouter } from "expo-router";

import { EmptyState } from "./states";

// Shown for a deep link or notification that points at something that's gone.
export function NotFoundState({
  title = "Not found",
  message = "This item doesn’t exist any more. It may have been deleted.",
}: {
  title?: string;
  message?: string;
}) {
  const router = useRouter();
  return (
    <EmptyState
      icon="help-circle-outline"
      title={title}
      message={message}
      actionLabel="Go to Today"
      onAction={() => router.replace("/")}
    />
  );
}
