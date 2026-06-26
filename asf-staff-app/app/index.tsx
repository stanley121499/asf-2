import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuthContext } from "@/context/AuthContext";
import { useStaffRole } from "@/context/StaffRoleContext";

/**
 * Entry route: staff session + resolved role → app tabs; otherwise sign-in.
 */
export default function Index(): React.ReactElement {
  const { user, loading: authLoading } = useAuthContext();
  const { role, loading: roleLoading } = useStaffRole();

  if (authLoading || (user !== null && roleLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (user === null || role === null) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(app)" />;
}
