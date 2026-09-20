import { Text, View } from "react-native";

import { Hero, heroInk } from "@/components/layout/hero";
import { Screen } from "@/components/layout/screen";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { selectAllSessions } from "@/features/focus/selectors";
import { computeAnalytics } from "@/features/productivity/analytics";
import { selectAllTasks } from "@/features/tasks/selectors";
import { useClock } from "@/hooks/use-clock";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

// Simple cards, no chart library. Weeks start on Monday.
export function ProductivityScreen() {
  const t = useTheme();
  const tasks = useAppSelector(selectAllTasks);
  const sessions = useAppSelector(selectAllSessions);
  const clock = useClock();
  const a = computeAnalytics(tasks, sessions, clock);
  const ink = heroInk(t);

  return (
    <Screen scroll>
      <Hero>
        <Text style={[t.type.subheading, { color: ink.muted }]}>COMPLETION RATE</Text>
        <Text style={[t.type.display, { color: ink.fg, fontSize: 48, lineHeight: 56 }]}>
          {a.completionRate === null ? "–" : `${a.completionRate}%`}
        </Text>
        <ProgressBar
          done={a.dueThisWeekCompleted}
          total={a.dueThisWeek}
          label="Due this week completed"
          color={ink.fill}
          trackColor={ink.track}
          height={12}
        />
        <Text style={[t.type.bodyStrong, { color: ink.muted }]}>
          {a.dueThisWeek === 0
            ? "Nothing due this week"
            : `${a.dueThisWeekCompleted} of ${a.dueThisWeek} due this week`}
        </Text>
      </Hero>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.md }}>
        <StatCard label="Completed today" value={String(a.completedToday)} icon="checkmark-circle" tint="purple" />
        <StatCard label="Completed this week" value={String(a.completedThisWeek)} icon="calendar" tint="blue" />
        <StatCard
          label="Overdue"
          value={String(a.overdue)}
          icon="alert-circle"
          tint="orange"
          tone={a.overdue > 0 ? "danger" : "default"}
        />
        <StatCard label="Focus sessions today" value={String(a.focusToday)} icon="timer" tint="amber" />
        <StatCard label="Focus sessions this week" value={String(a.focusThisWeek)} icon="flame" tint="slate" />
      </View>

      <Text style={[t.type.caption, { color: t.palette.textMuted, textAlign: "center" }]}>
        Weeks run Monday to Sunday.
      </Text>
    </Screen>
  );
}
