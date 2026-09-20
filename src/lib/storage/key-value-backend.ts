// Synchronous string key-value storage. MMKV in the app, a Map in tests.
export type KeyValueBackend = {
  keys(): string[];
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
};

export function createMemoryBackend(initial: Record<string, string> = {}): KeyValueBackend & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    keys: () => [...data.keys()],
    get: (key) => data.get(key),
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
  };
}
