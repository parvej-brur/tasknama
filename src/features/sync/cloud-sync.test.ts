import { beforeEach, describe, expect, it } from "@jest/globals";

import type { AppData } from "@/features/backup/backup";
import { DEFAULT_SETTINGS } from "@/features/settings/types";
import { createSupabaseClient } from "@/lib/supabase/client";
import { makeProject, makeTag, makeTask } from "@/testing/factories";
import { createFakeSupabase, type FakeSupabase } from "@/testing/fake-supabase";

import { downloadFromCloud, uploadToCloud } from "./cloud-sync";
import { SupabaseCloudStore } from "./supabase-cloud-store";

let fake: FakeSupabase;
let store: SupabaseCloudStore;

beforeEach(() => {
  fake = createFakeSupabase();
  store = new SupabaseCloudStore(
    createSupabaseClient({ url: "https://demo.supabase.co", anonKey: "anon" }, { fetch: fake.fetch }),
  );
});

function deviceData(): AppData {
  const project = makeProject({ name: "Home" });
  const tag = makeTag({ name: "later" });
  return {
    tasks: [
      makeTask({ projectId: project.id, tagIds: [tag.id], dueDate: "2026-09-21" }),
      makeTask({ completed: true, completedAt: "2026-09-20T12:00:00.000Z" }),
    ],
    projects: [project],
    tags: [tag],
    focusSessions: [],
    settings: { ...DEFAULT_SETTINGS, theme: "dark" },
  };
}

describe("uploadToCloud / downloadFromCloud", () => {
  it("restores exactly what was uploaded", async () => {
    const data = deviceData();
    const uploaded = await uploadToCloud(store, data);
    const restored = await downloadFromCloud(store, data.settings);

    expect(uploaded).toEqual({ tasks: 2, projects: 1, tags: 1 });
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    const byId = <T extends { id: string }>(items: T[]) => [...items].sort((a, b) => a.id.localeCompare(b.id));
    expect(byId(restored.data.tasks)).toEqual(byId(data.tasks));
    expect(restored.data.projects).toEqual(data.projects);
    expect(restored.data.tags).toEqual(data.tags);
    expect(restored.summary).toEqual({ tasks: 2, projects: 1, tags: 1, skipped: 0 });
  });

  it("keeps this device's settings on restore, and never uploads them", async () => {
    await uploadToCloud(store, deviceData());
    const restored = await downloadFromCloud(store, { ...DEFAULT_SETTINGS, theme: "light", focusMinutes: 40 });

    expect(restored.ok && restored.data.settings).toMatchObject({ theme: "light", focusMinutes: 40 });
    expect(Object.keys(fake.tables)).not.toContain("settings");
  });

  it("refuses to restore from an empty cloud so a device isn't wiped by accident", async () => {
    await expect(downloadFromCloud(store, DEFAULT_SETTINGS)).resolves.toEqual({ ok: false, reason: "empty" });
  });

  it("skips unreadable cloud rows and drops dangling links instead of failing", async () => {
    await uploadToCloud(store, deviceData());
    const [linked] = [...fake.tables.tm_tasks.values()].filter((t) => t.project_id !== null);
    linked.project_id = null;
    fake.tables.tm_tasks.set("bad", { ...linked, id: "bad", title: "" });

    const restored = await downloadFromCloud(store, DEFAULT_SETTINGS);

    expect(restored.ok && restored.summary).toMatchObject({ tasks: 2, skipped: 1 });
  });

  it("propagates network and server errors so the caller can report them", async () => {
    // 500, not 503: supabase-js retries a 503 on reads and would succeed.
    fake.failNext("GET", "tm_projects", 500);
    await expect(downloadFromCloud(store, DEFAULT_SETTINGS)).rejects.toThrow(/Supabase read tm_projects failed/);
  });
});
