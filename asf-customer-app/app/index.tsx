import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuthContext } from "@/context/AuthContext";

/**
 * Entry: send signed-in users to tabs, others to sign-in.
 */
export default function Index() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (user !== null) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
