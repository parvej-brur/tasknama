import type * as NotificationsModule from "expo-notifications";

// expo-notifications, or null when its native code isn't in this build.
//
// Expo Go doesn't ship every native module the library needs (it throws
// "Cannot find native module 'ExpoPushTokenManager'" the moment it is
// imported), and a static import would take the whole app down with it. Loading
// it here, guarded, lets the app run everywhere and simply turn reminders off
// where they can't work. A development build has the module and everything works.
function load(): typeof NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-notifications") as typeof NotificationsModule;
  } catch (error) {
    if (__DEV__) console.warn("[notifications] unavailable in this build:", error);
    return null;
  }
}

export const Notifications = load();
export const notificationsAvailable = Notifications !== null;
