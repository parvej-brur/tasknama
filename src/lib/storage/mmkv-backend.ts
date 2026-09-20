import { createMMKV } from "react-native-mmkv";

import type { KeyValueBackend } from "./key-value-backend";

// The app's on-device database: everything lives in one MMKV instance.
export function createMMKVBackend(id = "task-manager"): KeyValueBackend {
  const storage = createMMKV({ id });
  return {
    keys: () => storage.getAllKeys(),
    get: (key) => storage.getString(key),
    set: (key, value) => storage.set(key, value),
    remove: (key) => void storage.remove(key),
  };
}
