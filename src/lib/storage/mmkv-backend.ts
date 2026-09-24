import { createMMKV } from "react-native-mmkv";

import type { KeyValueBackend } from "./key-value-backend";

// The app's on-device database: everything lives in one MMKV instance.
// The default id predates the TaskNama name and must stay: it is the file name
// on disk, so changing it would orphan data already saved on users' devices.
export function createMMKVBackend(id = "task-manager"): KeyValueBackend {
  const storage = createMMKV({ id });
  return {
    keys: () => storage.getAllKeys(),
    get: (key) => storage.getString(key),
    set: (key, value) => storage.set(key, value),
    remove: (key) => void storage.remove(key),
  };
}
