import Constants from "expo-constants";
import { useState } from "react";
import { useStore } from "react-redux";
import { Alert, Text, View } from "react-native";

import { showSnackbar } from "@/components/feedback/feedback";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FieldLabel } from "@/components/ui/field-label";
import { IconButton } from "@/components/ui/icon-button";
import { Pill } from "@/components/ui/pill";
import { Segmented } from "@/components/ui/segmented";
import { LIMITS } from "@/config/limits";
import { replaceAllData } from "@/features/backup/actions";
import { parseBackup } from "@/features/backup/backup";
import { exportBackup, pickBackupFile } from "@/features/backup/backup-io";
import { selectAppData } from "@/features/backup/selectors";
import { selectLiveSession } from "@/features/focus/selectors";
import { useNotificationPermission } from "@/features/notifications/hooks/use-notification-permission";
import { cancelFocusEnd, openNotificationSettings } from "@/features/notifications/notifications";
import { PRESET_LABELS } from "@/features/notifications/reminder-planner";
import { REMINDER_PRESETS } from "@/features/notifications/types";
import { SEED_PREFIX, generateSeedTasks } from "@/features/settings/dev-seed";
import { settingsChanged } from "@/features/settings/store";
import { THEME_MODES, type ThemeMode } from "@/features/settings/types";
import { tasksBulkAdded, tasksBulkRemoved } from "@/features/tasks/store";
import type { RootState } from "@/lib/store/create-store";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

const THEME_LABELS: Record<ThemeMode, string> = { system: "System", light: "Light", dark: "Dark" };
const THEME_ICONS: Record<ThemeMode, React.ComponentProps<typeof Segmented>["options"][number]["icon"]> = {
  system: "phone-portrait-outline",
  light: "sunny-outline",
  dark: "moon-outline",
};

export function SettingsScreen() {
  const t = useTheme();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);
  const live = useAppSelector(selectLiveSession);
  const permission = useNotificationPermission();
  const store = useStore<RootState>();
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  const permissionText =
    permission.state === "granted"
      ? "Notifications are on."
      : permission.state === "denied"
        ? "Notifications are off. Turn them on in your device settings to get reminders."
        : permission.state === "unavailable"
          ? "Notifications aren’t available in this build (Expo Go doesn’t fully support them). Use a development build for reminders."
          : "Not asked yet. You’ll be asked when you set your first reminder.";

  const doExport = async () => {
    setBusy("export");
    try {
      await exportBackup(selectAppData(store.getState()));
    } catch {
      showSnackbar({ message: "Couldn’t export your data. Please try again.", tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy("import");
    try {
      const picked = await pickBackupFile();
      if (picked.status === "canceled") return;
      if (picked.status === "error") {
        showSnackbar({ message: picked.message, tone: "error" });
        return;
      }
      const parsed = parseBackup(picked.text);
      if (!parsed.ok) {
        Alert.alert("Can’t import this file", parsed.error);
        return;
      }
      const { summary, data } = parsed;
      const lines = [
        `${summary.tasks} tasks, ${summary.projects} projects, ${summary.tags} tags, ${summary.focusSessions} focus sessions.`,
        summary.skipped > 0 ? `${summary.skipped} unreadable or duplicate records will be skipped.` : null,
        summary.fromVersion < 2 ? "This file is from an older version and will be upgraded." : null,
        "",
        "Importing replaces everything currently on this device.",
      ].filter((line): line is string => line !== null);

      Alert.alert("Replace your data?", lines.join("\n"), [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace data",
          style: "destructive",
          onPress: () => {
            // A timer for a task that's about to vanish shouldn't fire later.
            if (live) void cancelFocusEnd(live.id);
            dispatch(replaceAllData(data));
            showSnackbar({ message: `Imported ${summary.tasks} tasks` });
          },
        },
      ]);
    } finally {
      setBusy(null);
    }
  };

  const seed = () => {
    const state = store.getState();
    dispatch(
      tasksBulkAdded(
        generateSeedTasks(5000, new Date(), Object.keys(state.projects.byId), Object.keys(state.tags.byId)),
      ),
    );
    showSnackbar({ message: "Added 5,000 test tasks" });
  };

  const unseed = () => {
    const ids = Object.keys(store.getState().tasks.byId).filter((id) => id.startsWith(SEED_PREFIX));
    dispatch(tasksBulkRemoved(ids));
    showSnackbar({ message: `Removed ${ids.length} test tasks` });
  };

  const minutes = settings.focusMinutes;
  const status =
    permission.state === "granted"
      ? { label: "On", tint: "purple" as const }
      : permission.state === "denied"
        ? { label: "Off", tint: "orange" as const }
        : permission.state === "unavailable"
          ? { label: "Unavailable", tint: "amber" as const }
          : { label: "Not asked", tint: undefined };

  return (
    <Screen scroll>
      <Card title="Appearance" subtitle="Follow your device or pick a look" icon="color-palette" tint="blue">
        <Segmented
          label="Theme"
          value={settings.theme}
          onChange={(mode) => dispatch(settingsChanged({ theme: mode }))}
          options={THEME_MODES.map((mode) => ({
            value: mode,
            label: THEME_LABELS[mode],
            icon: THEME_ICONS[mode],
            accessibilityLabel: `${THEME_LABELS[mode]} theme`,
          }))}
        />
      </Card>

      <Card title="Reminders" subtitle="When a task’s reminder should go off" icon="notifications" tint="amber">
        <View style={{ gap: t.spacing.sm }}>
          <FieldLabel label="Default reminder" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
            {REMINDER_PRESETS.map((preset) => (
              <Chip
                key={preset}
                label={PRESET_LABELS[preset]}
                selected={settings.defaultReminder === preset}
                onPress={() => dispatch(settingsChanged({ defaultReminder: preset }))}
              />
            ))}
          </View>
        </View>
        <View
          accessible
          accessibilityLabel={`Notification permission. ${permissionText}`}
          style={{ gap: t.spacing.sm, padding: t.spacing.lg, borderRadius: t.radius.md, backgroundColor: t.palette.surfaceAlt }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: t.spacing.md }}>
            <Text style={[t.type.bodyStrong, { color: t.palette.text }]}>Notifications</Text>
            <Pill label={status.label} tint={status.tint} bg={status.tint ? undefined : t.palette.surface} />
          </View>
          <Text style={[t.type.caption, { color: t.palette.textMuted }]}>{permissionText}</Text>
        </View>
        {permission.state === "denied" ? (
          <Button label="Open settings" variant="secondary" icon="settings-outline" onPress={() => void openNotificationSettings()} />
        ) : permission.state === "undetermined" ? (
          <Button label="Allow notifications" variant="secondary" icon="notifications-outline" onPress={() => void permission.request()} />
        ) : null}
      </Card>

      <Card title="Focus" subtitle="How long a session lasts" icon="timer" tint="slate">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "center",
            gap: t.spacing.sm,
            padding: t.spacing.xs,
            borderRadius: t.radius.pill,
            backgroundColor: t.palette.surfaceAlt,
          }}
        >
          <IconButton
            icon="remove-circle-outline"
            label="Shorter focus session"
            disabled={minutes <= LIMITS.focusMinutesMin}
            onPress={() => dispatch(settingsChanged({ focusMinutes: minutes - 1 }))}
          />
          <Text
            accessibilityRole="adjustable"
            accessibilityLabel="Focus duration"
            accessibilityValue={{ text: `${minutes} minutes` }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) =>
              dispatch(settingsChanged({ focusMinutes: minutes + (e.nativeEvent.actionName === "increment" ? 1 : -1) }))
            }
            style={[t.type.heading, { color: t.palette.text, minWidth: 96, textAlign: "center", fontVariant: ["tabular-nums"] }]}
          >
            {minutes} min
          </Text>
          <IconButton
            icon="add-circle-outline"
            label="Longer focus session"
            disabled={minutes >= LIMITS.focusMinutesMax}
            onPress={() => dispatch(settingsChanged({ focusMinutes: minutes + 1 }))}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm, justifyContent: "center" }}>
          {[15, 25, 45, 60].map((m) => (
            <Chip key={m} label={`${m} min`} selected={minutes === m} onPress={() => dispatch(settingsChanged({ focusMinutes: m }))} />
          ))}
        </View>
      </Card>

      <Card title="Your data" subtitle="Stored only on this device" icon="shield-checkmark" tint="purple">
        <Text style={[t.type.body, { color: t.palette.textMuted }]}>
          Everything stays on this device. Export a JSON backup to keep a copy or move to another device.
        </Text>
        <View style={{ gap: t.spacing.sm }}>
          <Button label="Export data" icon="share-outline" variant="secondary" loading={busy === "export"} onPress={doExport} />
          <Button label="Import data" icon="download-outline" variant="secondary" loading={busy === "import"} onPress={doImport} />
        </View>
      </Card>

      {__DEV__ ? (
        <Card title="Developer" icon="code-slash" tint="orange">
          <Button label="Seed 5,000 tasks" variant="secondary" onPress={seed} />
          <Button label="Remove seeded tasks" variant="secondary" onPress={unseed} />
        </Card>
      ) : null}

      <Text style={[t.type.caption, { color: t.palette.textMuted, textAlign: "center" }]}>
        Task Manager {Constants.expoConfig?.version ?? ""}
      </Text>
    </Screen>
  );
}
