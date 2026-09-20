// Supabase is optional. With no URL and key the app is purely local and the
// cloud backup card reports that it isn't set up.
//
// Expo inlines `process.env.EXPO_PUBLIC_*` at build time, and only when the
// variable is written out in full, so these two reads must stay literal.
// The anon key is designed to ship in a client; never put a service-role key here.

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

// The values in .env.example. Copying it without editing must leave the app
// unconfigured rather than "configured" with a key that can never work.
const PLACEHOLDER = /your-project-ref|your-anon-key/i;

// Returns null unless both values are present, are not the .env.example
// placeholders, and the URL is a valid http(s) URL.
export function parseSupabaseConfig(
  url: string | undefined,
  anonKey: string | undefined,
): SupabaseConfig | null {
  const trimmedUrl = url?.trim() ?? "";
  const trimmedKey = anonKey?.trim() ?? "";
  if (!trimmedUrl || !trimmedKey) return null;
  if (PLACEHOLDER.test(trimmedUrl) || PLACEHOLDER.test(trimmedKey)) return null;
  try {
    const { protocol } = new URL(trimmedUrl);
    if (protocol !== "https:" && protocol !== "http:") return null;
  } catch {
    return null;
  }
  return { url: trimmedUrl.replace(/\/+$/, ""), anonKey: trimmedKey };
}

const config = parseSupabaseConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

export const isSupabaseConfigured = config !== null;

export function getSupabaseConfig(): SupabaseConfig {
  if (!config) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env and set " +
        "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart " +
        "the bundler with `npx expo start --clear`.",
    );
  }
  return config;
}
