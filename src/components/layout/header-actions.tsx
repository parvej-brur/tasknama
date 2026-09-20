import { useRouter } from "expo-router";

import { IconButton } from "@/components/ui/icon-button";
import { ADD_BUTTON } from "@/theme";

// Search everything, and (on the capture tabs) jump to quick add. Sits in a ScreenHeader.
export function HeaderActions({ quickAdd = false }: { quickAdd?: boolean }) {
  const router = useRouter();
  return (
    <>
      <IconButton
        variant="soft"
        icon="search"
        label="Search all tasks"
        color={ADD_BUTTON.bg}
        onPress={() => router.push("/tasks/all")}
      />

      {quickAdd ? (
        <IconButton
          variant="soft"
          icon="flash"
          label="Quick add"
          color={ADD_BUTTON.fg}
          fill={ADD_BUTTON.bg}
          onPress={() => router.push("/quick-add")}
        />
      ) : null}
    </>
  );
}
