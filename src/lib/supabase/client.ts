import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig, type SupabaseConfig } from "@/config/supabase";

// There are no user accounts, so there is no session to persist or refresh.
export function createSupabaseClient(
  config: SupabaseConfig = getSupabaseConfig(),
  options: { fetch?: typeof fetch } = {},
): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: options.fetch ? { fetch: options.fetch } : undefined,
  });
}

let shared: SupabaseClient | null = null;

// One client for the app, created on first use so an unconfigured build never
// touches the SDK.
export function getSupabaseClient(): SupabaseClient {
  shared ??= createSupabaseClient();
  return shared;
}
