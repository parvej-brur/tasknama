import { Pill } from "@/components/ui/pill";
import type { Priority } from "@/features/tasks/types";
import { PRIORITY_META, priorityColor, priorityTint, useTheme } from "@/theme";

// Priority is shown with colour, an icon and a text label, never colour alone.
export function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useTheme();
  const meta = PRIORITY_META[priority];
  return (
    <Pill
      label={meta.label}
      icon={meta.icon}
      fg={priorityColor(priority, t.palette)}
      bg={priorityTint(priority, t.palette)}
      accessibilityLabel={`${meta.label} priority`}
    />
  );
}
