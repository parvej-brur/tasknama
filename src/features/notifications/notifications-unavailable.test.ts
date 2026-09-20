import { describe, expect, it, jest } from "@jest/globals";

import {
  cancelFocusEnd,
  ensureChannels,
  ensurePermission,
  getPermissionState,
  reconcileReminders,
  scheduleFocusEnd,
} from "./notifications";
import { Notifications, notificationsAvailable } from "./notifications-module";

// Reproduces Expo Go: importing expo-notifications throws because a native
// module isn't bundled. The app must still load and simply skip reminders.
// (jest.mock is hoisted above the imports, so the throw happens at import time.)
jest.mock("expo-notifications", () => {
  throw new Error("Cannot find native module 'ExpoPushTokenManager'");
});

describe("notifications without native support", () => {
  it("loads without throwing and reports notifications as unavailable", () => {
    expect(Notifications).toBeNull();
    expect(notificationsAvailable).toBe(false);
  });

  it("every entry point is a safe no-op", async () => {
    await expect(getPermissionState()).resolves.toBe("unavailable");
    await expect(ensurePermission()).resolves.toBe("unavailable");
    await expect(reconcileReminders([])).resolves.toBeUndefined();
    await expect(scheduleFocusEnd("s", "Task", Date.now() + 1000)).resolves.toBeUndefined();
    await expect(cancelFocusEnd("s")).resolves.toBeUndefined();
    await expect(ensureChannels()).resolves.toBeUndefined();
  });
});
