import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { toDateKey } from "@/utils/date";

import { buildBackup, type AppData } from "./backup";

// Writes the backup to a temp file and opens the system share sheet.
export async function exportBackup(data: AppData, now: Date = new Date()): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }
  const file = new File(Paths.cache, `task-manager-${toDateKey(now)}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(buildBackup(data, now), null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: "Export tasks",
  });
}

export type PickResult =
  | { status: "picked"; text: string }
  | { status: "canceled" }
  | { status: "error"; message: string };

// Lets the user choose a JSON file and reads it as text.
export async function pickBackupFile(): Promise<PickResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain", "public.json"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || result.assets.length === 0) return { status: "canceled" };
    const text = await new File(result.assets[0].uri).text();
    return { status: "picked", text };
  } catch {
    return { status: "error", message: "Couldn't read that file." };
  }
}
