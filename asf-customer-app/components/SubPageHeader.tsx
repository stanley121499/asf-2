import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";

interface SubPageHeaderProps {
  title: string;
  /** Optional right-side element (e.g. "mark all read" button) */
  right?: React.ReactNode;
}

/**
 * Reusable sticky header for push screens inside the profile stack.
 * Matches web's 56px centered-title + back-arrow pattern.
 */
export function SubPageHeader({ title, right }: SubPageHeaderProps): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();

  /**
   * Pop within the profile stack when possible. When this screen was entered
   * directly via `router.replace` (e.g. order detail from checkout success), the
   * profile stack only holds this one screen (local index 0). In that case
   * `router.back()` bubbles up to the Tabs navigator and lands on the home tab,
   * so we explicitly route to the profile home to avoid locking the user out.
   * `router.canGoBack()` cannot be used here because it returns true thanks to
   * the parent navigators even when the local stack has nothing to pop.
   */
  const handleBack = (): void => {
    const state = navigation.getState();
    const localIndex = typeof state?.index === "number" ? state.index : 0;
    if (localIndex > 0) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          paddingHorizontal: 56,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={8}
          style={{
            position: "absolute",
            left: 16,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 18,
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {right !== undefined && (
          <View style={{ position: "absolute", right: 16 }}>{right}</View>
        )}
      </View>
    </SafeAreaView>
  );
}
