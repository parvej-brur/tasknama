import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "TaskNama",
  slug: "tasknama",
  version: "2.1.0",
  orientation: "portrait",
  owner: "parvejsikdar",
  icon: "./assets/images/icon.png",
  scheme: "tasknama",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.parvejsikdar.tasknama",
    icon: {
      light: "./assets/images/icon.png",
      dark: "./assets/images/icon-dark.png",
      tinted: "./assets/images/icon-tinted.png",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#1B3A8F",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.parvejsikdar.tasknama",
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
        imageWidth: 280,
        resizeMode: "contain",
        backgroundColor: "#F4F6FA",
        dark: {
          image: "./assets/images/splash-icon-dark.png",
          backgroundColor: "#0A101F",
        },
      },
    ],
    "@react-native-community/datetimepicker",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
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
