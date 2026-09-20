import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { announce, showSnackbar } from "@/components/feedback/feedback";
import { EmptyState, StateBadge } from "@/components/feedback/states";
import { Hero, heroInk } from "@/components/layout/hero";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchField } from "@/components/ui/search-field";
import {
  pauseFocus,
  reconcileFocus,
  resumeFocus,
  startFocus,
  stopFocus,
} from "@/features/focus/actions";
import { selectLiveSession, selectPendingCompletion } from "@/features/focus/selectors";
import { remainingMs } from "@/features/focus/session";
import { focusSessionAcknowledged } from "@/features/focus/store";
import { completeTask } from "@/features/tasks/actions";
import { selectAllTasks } from "@/features/tasks/selectors";
import { queryTasks, DEFAULT_QUERY } from "@/features/tasks/task-query";
import { useClock } from "@/hooks/use-clock";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";
import { formatDuration } from "@/utils/date";

// Pick a task, then start / pause / resume / stop. The countdown is derived
// from an end timestamp on every tick, so it stays right after the app was
// backgrounded or killed. No points, streaks or sounds.
export function FocusScreen({ taskId }: { taskId?: string }) {
  const t = useTheme();
  const dispatch = useAppDispatch();
  const live = useAppSelector(selectLiveSession);
  const pending = useAppSelector(selectPendingCompletion);
  const minutes = useAppSelector((s) => s.settings.focusMinutes);

  // Tick twice a second while running; reconcile completes an expired session.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live || live.status !== "running") return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      const finished = dispatch(reconcileFocus(current));
      if (finished) announce("Focus session complete");
    }, 500);
    return () => clearInterval(timer);
  }, [live, dispatch]);

  // Catch a session that ended while this screen wasn't mounted.
  useEffect(() => {
    dispatch(reconcileFocus());
  }, [dispatch]);

  if (pending) return <SessionEnded sessionId={pending.id} taskId={pending.taskId} />;
  if (live) return <ActiveSession now={now} />;
  return <TaskPicker initialTaskId={taskId} minutes={minutes} onStart={(id) => dispatch(startFocus(id))} t={t} />;
}

function ActiveSession({ now }: { now: number }) {
  const t = useTheme();
  const dispatch = useAppDispatch();
  const live = useAppSelector(selectLiveSession);
  const task = useAppSelector((s) => (live ? s.tasks.byId[live.taskId] : undefined));
  if (!live) return null;

  const left = remainingMs(live, now);
  const paused = live.status === "paused";
  const spoken = `${Math.floor(left / 60_000)} minutes ${Math.ceil((left % 60_000) / 1000)} seconds remaining`;
  const ink = heroInk(t);
  const totalSeconds = Math.max(1, Math.round(live.durationMs / 1000));
  const elapsedSeconds = Math.min(totalSeconds, Math.max(0, totalSeconds - Math.round(left / 1000)));

  return (
    <Screen scroll>
      <Hero style={{ alignItems: "center", paddingVertical: t.spacing.xxl, gap: t.spacing.lg }}>
        <Text style={[t.type.subheading, { color: ink.muted }]}>{paused ? "PAUSED" : "FOCUSING ON"}</Text>
        <Text accessibilityRole="header" style={[t.type.heading, { color: ink.fg, textAlign: "center" }]}>
          {task ? task.title : "A task that no longer exists"}
        </Text>
        <Text
          accessibilityLabel={spoken}
          accessibilityRole="timer"
          style={{
            fontFamily: t.fonts.headingBold,
            fontSize: 68,
            lineHeight: 80,
            letterSpacing: -1,
            color: ink.fg,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatDuration(left)}
        </Text>
        {
          // The timer above is read aloud; this bar is only a visual echo of it.
        }
        <View
          style={{ alignSelf: "stretch" }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ProgressBar
            done={elapsedSeconds}
            total={totalSeconds}
            label="Session progress"
            color={ink.fill}
            trackColor={ink.track}
            height={12}
          />
        </View>
      </Hero>
      <View style={{ gap: t.spacing.md }}>
        {paused ? (
          <Button label="Resume" icon="play" onPress={() => dispatch(resumeFocus())} />
        ) : (
          <Button label="Pause" icon="pause" onPress={() => dispatch(pauseFocus())} />
        )}
        <Button
          label="Stop"
          variant="danger"
          icon="stop"
          onPress={() =>
            Alert.alert("Stop this session?", "It won’t count towards your focus sessions.", [
              { text: "Keep going", style: "cancel" },
              { text: "Stop session", style: "destructive", onPress: () => dispatch(stopFocus()) },
            ])
          }
        />
      </View>
    </Screen>
  );
}

function SessionEnded({ sessionId, taskId }: { sessionId: string; taskId: string }) {
  const t = useTheme();
  const dispatch = useAppDispatch();
  const task = useAppSelector((s) => s.tasks.byId[taskId]);
  const done = () => dispatch(focusSessionAcknowledged(sessionId));

  return (
    <Screen scroll>
      <View style={{ alignItems: "center", gap: t.spacing.md, paddingVertical: t.spacing.xl }}>
        <StateBadge icon="checkmark-done" tint="purple" />
        <Text accessibilityRole="header" style={[t.type.title, { color: t.palette.text, textAlign: "center" }]}>
          Session complete
        </Text>
        <Text style={[t.type.body, { color: t.palette.textMuted, textAlign: "center", maxWidth: 320 }]}>
          {task ? `You finished a focus session on “${task.title}”.` : "You finished a focus session."}
        </Text>
      </View>
      <View style={{ gap: t.spacing.md }}>
        {task && !task.completed ? (
          <Button
            label="Complete the task"
            icon="checkmark-circle"
            onPress={() => {
              dispatch(completeTask(taskId));
              done();
              showSnackbar({ message: `Completed “${task.title}”` });
            }}
          />
        ) : null}
        {task ? (
          <Button
            label="Start another session"
            variant="secondary"
            icon="refresh"
            onPress={() => {
              done();
              dispatch(startFocus(taskId));
            }}
          />
        ) : null}
        <Button label="Done" variant="ghost" onPress={done} />
      </View>
    </Screen>
  );
}

// A task to focus on. One is selected at a time, like a radio group.
function Choice({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`Pick ${title}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          minHeight: 60,
          flexDirection: "row",
          alignItems: "center",
          gap: t.spacing.md,
          paddingHorizontal: t.spacing.lg,
          paddingVertical: t.spacing.md,
          borderRadius: t.radius.lg - 2,
          borderWidth: 2,
          borderColor: selected ? t.palette.primary : "transparent",
          backgroundColor: selected ? t.palette.primaryMuted : t.palette.surface,
          opacity: pressed ? 0.85 : 1,
        },
        t.shadow.card,
      ]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: selected ? 0 : 2,
          borderColor: t.palette.borderStrong,
          backgroundColor: selected ? t.palette.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? <Ionicons name="checkmark" size={16} color={t.palette.onPrimary} /> : null}
      </View>
      <Text numberOfLines={2} style={[t.type.bodyStrong, { flex: 1, color: t.palette.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}

function TaskPicker({
  initialTaskId,
  minutes,
  onStart,
  t,
}: {
  initialTaskId?: string;
  minutes: number;
  onStart: (taskId: string) => void;
  t: ReturnType<typeof useTheme>;
}) {
  const tasks = useAppSelector(selectAllTasks);
  const clock = useClock();
  const navigation = useNavigation();
  const [text, setText] = useState("");
  const search = useDebouncedValue(text, 250);
  const [selected, setSelected] = useState<string | null>(initialTaskId ?? null);

  const choices = queryTasks(tasks, { ...DEFAULT_QUERY, status: "active", search }, clock).slice(0, 30);
  const chosen = selected ? tasks.find((task) => task.id === selected) : undefined;

  // The header's Start button belongs to the picker only; never leave it behind
  // once a session is running.
  useEffect(() => () => navigation.setOptions({ headerRight: undefined }), [navigation]);

  if (tasks.every((task) => task.completed)) {
    return (
      <EmptyState
        icon="timer-outline"
        tint="amber"
        title="Nothing to focus on"
        message="Add a task first, then pick it here to start a focus session."
      />
    );
  }

  return (
    <Screen scroll keyboard>
      {
        // The list can be long, so Start stays in the header too.
      }
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button label="Start" variant="ghost" size="sm" disabled={!chosen} onPress={() => chosen && onStart(chosen.id)} />
          ),
        }}
      />
      <Text style={[t.type.body, { color: t.palette.textMuted }]}>
        Pick a task and work on it for {minutes} {minutes === 1 ? "minute" : "minutes"}. You can change the length in Settings.
      </Text>
      <View style={{ flexDirection: "row" }}>
        <SearchField value={text} onChangeText={setText} placeholder="Search your tasks" />
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel="Tasks" style={{ gap: t.spacing.md }}>
        {choices.map((task) => (
          <Choice key={task.id} title={task.title} selected={selected === task.id} onPress={() => setSelected(task.id)} />
        ))}
        {choices.length === 0 ? (
          <Text style={[t.type.body, { color: t.palette.textMuted }]}>No matching active tasks.</Text>
        ) : null}
      </View>
      <Button
        label={chosen ? `Start ${minutes} min on “${chosen.title}”` : "Pick a task to start"}
        icon="play"
        disabled={!chosen}
        onPress={() => chosen && onStart(chosen.id)}
      />
    </Screen>
  );
}
