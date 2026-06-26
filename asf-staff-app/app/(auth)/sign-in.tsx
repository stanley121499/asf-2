import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/FormField";
import { parseStaffRole } from "@/constants/roles";
import { useAlertContext } from "@/context/AlertContext";
import { useAuthContext } from "@/context/AuthContext";
import { useStaffRole } from "@/context/StaffRoleContext";
import { supabase } from "@/lib/supabase";

/**
 * Staff login screen.
 *
 * Wrapped in KeyboardAvoidingView + ScrollView so the software keyboard
 * never covers the form fields or the submit button on any device/OS.
 * Requires a `staff_roles` row — access is denied otherwise.
 */
export default function StaffSignInScreen(): React.ReactElement {
  const router = useRouter();
  const { signIn } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { setStaffRoleLocal } = useStaffRole();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (): Promise<void> => {
    setBusy(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.error !== null || result.user === null) {
        showAlert(result.error?.message ?? "登录失败", "error");
        return;
      }

      const uid = result.user.id;
      const { data, error } = await supabase
        .from("staff_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) {
        await supabase.auth.signOut();
        showAlert(error.message, "error");
        return;
      }

      const roleRaw = data?.role;
      if (typeof roleRaw !== "string") {
        await supabase.auth.signOut();
        showAlert("访问被拒绝，请联系管理员。", "error");
        return;
      }

      const parsed = parseStaffRole(roleRaw);
      if (parsed === null) {
        await supabase.auth.signOut();
        showAlert("访问被拒绝，请联系管理员。", "error");
        return;
      }

      await setStaffRoleLocal(parsed, uid);
      router.replace("/(app)");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F3" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Page title */}
          <Text style={{
            fontSize: 12,
            fontWeight: "700",
            color: "#C9A96E",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 8,
          }}>
            Staff Portal
          </Text>
          <Text style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#0A0A0A",
            letterSpacing: -1,
            textAlign: "center",
            marginBottom: 40,
          }}>
            员工登录
          </Text>

          {/* Email field */}
          <FormField
            label="邮箱"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
          />

          {/* Password field */}
          <FormField
            label="密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          {/* Show / hide password toggle */}
          <Pressable
            style={{ marginBottom: 32, alignSelf: "flex-start" }}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "500" }}>
              {showPassword ? "隐藏密码" : "显示密码"}
            </Text>
          </Pressable>

          {/* Submit button */}
          <Pressable
            disabled={busy}
            onPress={() => void onSubmit()}
            style={({ pressed }) => ({
              opacity: pressed || busy ? 0.8 : 1,
            })}
          >
            <View style={{
              height: 56,
              borderRadius: 16,
              backgroundColor: "#0A0A0A",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#0A0A0A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            }}>
              {busy ? (
                <ActivityIndicator color="#C9A96E" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5 }}>
                  登录
                </Text>
              )}
            </View>
          </Pressable>

          {/* Bottom spacer so content doesn't sit flush against keyboard */}
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
