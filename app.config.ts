import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "TaskManager",
  slug: "task-for-shareviral",
  version: "2.1.0",
  orientation: "portrait",
  owner: "parvejsikdar",
  icon: "./assets/images/icon.png",
  scheme: "taskmanager",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.parvejsikdar.taskforshareviral",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#183985",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.parvejsikdar.taskforshareviral",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "@react-native-community/datetimepicker",
    [
      "expo-notifications",
      {
        color: "#2557D6",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "e6135146-024b-4b82-b681-d55df83e2373",
    },
  },
};

export default config;
