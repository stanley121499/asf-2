import { Stack } from "expo-router";

export default function AuthLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: true, headerTitle: "员工登录" }} />
  );
}
