import { useState } from "react";
import { Alert, Text } from "react-native";
import { useStore } from "react-redux";

import { showSnackbar } from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/config/supabase";
import { replaceAllData } from "@/features/backup/actions";
import { selectAppData } from "@/features/backup/selectors";
import { selectLiveSession } from "@/features/focus/selectors";
import { cancelFocusEnd } from "@/features/notifications/notifications";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RootState } from "@/lib/store/create-store";
import { useAppDispatch } from "@/lib/store/hooks";
import { useTheme } from "@/theme";

import { downloadFromCloud, uploadToCloud } from "@/features/sync/cloud-sync";
import { SupabaseCloudStore } from "@/features/sync/supabase-cloud-store";

type Busy = "upload" | "restore" | null;

const FAILURE = "Couldn’t reach the cloud. Check your connection and try again.";

// Optional cloud copy of the user's data. The device stays the source of truth;
// this only uploads a copy or replaces the device's data from that copy.
export function CloudSyncCard() {
  const t = useTheme();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [busy, setBusy] = useState<Busy>(null);

  const cloud = () => new SupabaseCloudStore(getSupabaseClient());

  const upload = async () => {
    setBusy("upload");
    try {
      const { tasks, projects, tags } = await uploadToCloud(cloud(), selectAppData(store.getState()));
      showSnackbar({ message: `Uploaded ${tasks} tasks, ${projects} projects, ${tags} tags` });
    } catch {
      showSnackbar({ message: FAILURE, tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy("restore");
    try {
      const result = await downloadFromCloud(cloud(), store.getState().settings);
      if (!result.ok) {
        Alert.alert("Nothing to restore", "There is no data in the cloud yet. Upload from this device first.");
        return;
      }
      const { summary, data } = result;
      const lines = [
        `${summary.tasks} tasks, ${summary.projects} projects, ${summary.tags} tags.`,
        summary.skipped > 0 ? `${summary.skipped} unreadable records will be skipped.` : null,
        "",
        "Restoring replaces everything currently on this device.",
      ].filter((line): line is string => line !== null);

      Alert.alert("Replace your data?", lines.join("\n"), [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace data",
          style: "destructive",
          onPress: () => {
            // A timer for a task that's about to vanish shouldn't fire later.
            const live = selectLiveSession(store.getState());
            if (live) void cancelFocusEnd(live.id);
            dispatch(replaceAllData(data));
            showSnackbar({ message: `Restored ${summary.tasks} tasks` });
          },
        },
      ]);
    } catch {
      showSnackbar({ message: FAILURE, tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const confirmUpload = () =>
    Alert.alert(
      "Replace the cloud copy?",
      "The copy in the cloud will be overwritten with the data on this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Upload", onPress: () => void upload() },
      ],
    );

  return (
    <Card
      title="Cloud backup"
      subtitle={isSupabaseConfigured ? "Optional copy in your Supabase project" : "Not set up in this build"}
      icon="cloud"
      tint="blue"
    >
      <Text style={[t.type.body, { color: t.palette.textMuted }]}>
        {isSupabaseConfigured
          ? "This device stays the source of truth. Upload saves a copy to the cloud; restore replaces this device’s data with that copy. Theme and reminder defaults stay on the device."
          : "Add a Supabase URL and key to turn on cloud backup. Until then, everything stays on this device."}
      </Text>
      <Button
        label="Upload to cloud"
        icon="cloud-upload-outline"
        variant="secondary"
        disabled={!isSupabaseConfigured || busy !== null}
        loading={busy === "upload"}
        onPress={confirmUpload}
      />
      <Button
        label="Restore from cloud"
        icon="cloud-download-outline"
        variant="secondary"
        disabled={!isSupabaseConfigured || busy !== null}
        loading={busy === "restore"}
        onPress={() => void restore()}
      />
    </Card>
  );
}
