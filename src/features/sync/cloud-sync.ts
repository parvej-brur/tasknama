import { normalizeAppData, type AppData } from "@/features/backup/backup";
import type { Settings } from "@/features/settings/types";

import type { CloudData, CloudStore } from "./supabase-cloud-store";

export type UploadResult = { tasks: number; projects: number; tags: number };

export type RestoreResult =
  | { ok: true; data: AppData; summary: UploadResult & { skipped: number } }
  | { ok: false; reason: "empty" };

// Copies this device's data to the cloud, replacing what was there.
export async function uploadToCloud(store: CloudStore, data: AppData): Promise<UploadResult> {
  const cloudData: CloudData = {
    tasks: data.tasks,
    projects: data.projects,
    tags: data.tags,
    focusSessions: data.focusSessions,
  };
  await store.replace(cloudData);
  return { tasks: data.tasks.length, projects: data.projects.length, tags: data.tags.length };
}

// Reads the cloud copy and turns it into app data ready to replace the local
// state. An empty cloud is reported instead of returned, so a first-time
// "restore" can't wipe a device by accident. `settings` stays as it is: the
// theme and reminder defaults belong to the device.
export async function downloadFromCloud(
  store: CloudStore,
  settings: Settings,
): Promise<RestoreResult> {
  const raw = await store.fetch();
  if (raw.tasks.length === 0 && raw.projects.length === 0 && raw.tags.length === 0) {
    return { ok: false, reason: "empty" };
  }
  const { data, skipped } = normalizeAppData({ ...raw, settings });
  return {
    ok: true,
    data,
    summary: {
      tasks: data.tasks.length,
      projects: data.projects.length,
      tags: data.tags.length,
      skipped,
    },
  };
}
