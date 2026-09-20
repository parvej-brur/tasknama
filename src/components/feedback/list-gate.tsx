import { retryStorage, useStorageStatus } from "@/lib/store";

import { ErrorState, LoadingState } from "./states";

// Wraps a list screen with its loading and error states. Data is local and
// loads synchronously, so these only show if storage can't be opened.
export function ListGate({ children }: { children: React.ReactNode }) {
  const status = useStorageStatus();
  if (status === "loading") return <LoadingState label="Opening your tasks" />;
  if (status === "error") {
    return (
      <ErrorState
        title="Couldn’t open your tasks"
        message="Your saved data couldn’t be read from this device. Nothing was deleted. Try again."
        onRetry={retryStorage}
      />
    );
  }
  return <>{children}</>;
}
