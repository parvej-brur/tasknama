import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type RefreshControlProps,
} from "react-native";

import { useTheme } from "@/theme";

type Props = {
  children: React.ReactNode;
  // Wrap children in a scroll view (forms, detail pages).
  scroll?: boolean;
  // Lift content above the keyboard (forms).
  keyboard?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function Screen({ children, scroll, keyboard, refreshControl }: Props) {
  const t = useTheme();
  const content = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: t.spacing.lg,
        gap: t.spacing.lg,
        paddingBottom: t.spacing.xxl * 2,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}
