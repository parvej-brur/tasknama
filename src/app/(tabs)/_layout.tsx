import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { useTheme } from "@/theme";

export { RouteError as ErrorBoundary } from "@/components/feedback/route-error";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// The icon sits on a soft pill while its tab is active, so the current place is clear without relying on colour alone.
function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused }: { color: string; size: number; focused: boolean }) {
    const t = useTheme();
    return (
      <View
        style={{
          width: 58,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? t.palette.highlight.bg : "transparent",
        }}
      >
        <Ionicons name={focused ? active : inactive} size={22} color={color} />
      </View>
    );
  };
}

// The four daily destinations. Everything else lives under Browse. Each tab
// draws its own large title (ScreenHeader), so the native header is off.
export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.palette.highlight.fg,
        tabBarInactiveTintColor: t.palette.textMuted,
        tabBarLabelStyle: { fontFamily: t.fonts.bodySemiBold, fontSize: 11, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: t.palette.surface,
          borderTopWidth: t.scheme === "dark" ? 1 : 0,
          borderTopColor: t.palette.border,
          paddingTop: 8,
          shadowColor: t.palette.shadow,
          shadowOpacity: t.scheme === "dark" ? 0 : 0.1,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
          elevation: 16,
        },
        sceneStyle: { backgroundColor: t.palette.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: tabIcon("today", "today-outline") }} />
      <Tabs.Screen name="inbox" options={{ title: "Inbox", tabBarIcon: tabIcon("file-tray", "file-tray-outline") }} />
      <Tabs.Screen name="upcoming" options={{ title: "Upcoming", tabBarIcon: tabIcon("calendar", "calendar-outline") }} />
      <Tabs.Screen name="browse" options={{ title: "Browse", tabBarIcon: tabIcon("apps", "apps-outline") }} />
    </Tabs>
  );
}
