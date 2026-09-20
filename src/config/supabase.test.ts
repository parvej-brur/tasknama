import { describe, expect, it } from "@jest/globals";

import { getSupabaseConfig, isSupabaseConfigured, parseSupabaseConfig } from "./supabase";

describe("parseSupabaseConfig", () => {
  it("accepts a URL and key, trimming whitespace and trailing slashes", () => {
    expect(parseSupabaseConfig(" https://abc.supabase.co/ ", " key ")).toEqual({
      url: "https://abc.supabase.co",
      anonKey: "key",
    });
  });

  it("is null when either value is missing or blank", () => {
    expect(parseSupabaseConfig(undefined, "key")).toBeNull();
    expect(parseSupabaseConfig("https://abc.supabase.co", undefined)).toBeNull();
    expect(parseSupabaseConfig("  ", "key")).toBeNull();
    expect(parseSupabaseConfig("https://abc.supabase.co", "")).toBeNull();
  });

  it("treats the .env.example placeholders as not configured", () => {
    expect(parseSupabaseConfig("https://your-project-ref.supabase.co", "real-key")).toBeNull();
    expect(parseSupabaseConfig("https://abc.supabase.co", "your-anon-key")).toBeNull();
  });

  it("is null for something that isn't an http(s) URL", () => {
    expect(parseSupabaseConfig("your-project-ref", "key")).toBeNull();
    expect(parseSupabaseConfig("ftp://abc.supabase.co", "key")).toBeNull();
  });
});

describe("with no environment variables", () => {
  it("reports Supabase as not configured and explains how to set it up", () => {
    expect(isSupabaseConfigured).toBe(false);
    expect(() => getSupabaseConfig()).toThrow(/\.env\.example/);
  });
});
