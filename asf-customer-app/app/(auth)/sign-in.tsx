import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { colors } from "@/constants/theme";

/**
 * Sign-in screen matching the web app exactly:
 * - Top ~25% white area with "← 返回首页" and large "ASF" in display font
 * - Bottom white sheet (rounded-t-3xl, overlap) with form
 * - Inputs: 56px height, rounded-xl, panel bg (#F5F5F3)
 * - Submit button: bg-black, full-width, 56px, rounded-xl, white text
 */
export default function SignInScreen(): React.ReactElement {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = submitting || authLoading;

  const onSubmit = async (): Promise<void> => {
    setError(null);
    const trimmed = email.trim();
    if (trimmed.length === 0 || password.length === 0) {
      setError("请输入邮箱和密码");
      return;
    }
    setSubmitting(true);
    try {
      const { error: signErr } = await signIn(trimmed, password);
      if (signErr !== null) {
        const msg = signErr.message.toLowerCase().includes("invalid login credentials")
          ? "邮箱或密码不正确，请重试"
          : "登录失败，请重试";
        setError(msg);
        return;
      }
      router.replace("/(tabs)");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top section — white bg, back button + ASF logo */}
        <View style={{ height: 200, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
          <Pressable
            onPress={() => router.push("/(tabs)")}
            style={{ position: "absolute", top: 16, left: 16, flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }}>← 返回首页</Text>
          </Pressable>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 48,
              color: colors.text,
              letterSpacing: 8,
              fontWeight: "900",
            }}
          >
            ASF
          </Text>
        </View>

        {/* Bottom sheet — white, rounded-t-3xl, overlaps top section */}
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -24,
          }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 24,
              color: colors.text,
              marginBottom: 24,
            }}
          >
            欢迎回来
          </Text>

          {error !== null && (
            <View style={{ marginBottom: 16, padding: 12, backgroundColor: "#FEF2F2", borderRadius: 8 }}>
              <Text style={{ fontSize: 14, color: colors.danger, fontFamily: "Inter_400Regular" }}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
            邮箱地址
          </Text>
          <TextInput
            style={{
              height: 56,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.panel,
              color: colors.text,
              fontSize: 16,
              marginBottom: 16,
              fontFamily: "Inter_400Regular",
            }}
            placeholder="请输入邮箱"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!busy}
          />

          {/* Password */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
            密码
          </Text>
          <View style={{ position: "relative", marginBottom: 8 }}>
            <TextInput
              style={{
                height: 56,
                paddingHorizontal: 16,
                paddingRight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.panel,
                color: colors.text,
                fontSize: 16,
                fontFamily: "Inter_400Regular",
              }}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              editable={!busy}
            />
            <Pressable
              onPress={() => setShowPassword((p) => !p)}
              style={{ position: "absolute", right: 12, top: 16 }}
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>

          {/* Forgot password */}
          <View style={{ alignItems: "flex-end", marginBottom: 24 }}>
            <Link href="/(auth)/forgot-password">
              <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>忘记密码？</Text>
            </Link>
          </View>

          {/* Login button — bg-black, 56px, rounded-xl */}
          <Pressable
            onPress={() => void onSubmit()}
            disabled={busy}
            style={{
              height: 56,
              backgroundColor: "#000000",
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                登录
              </Text>
            )}
          </Pressable>

          {/* Browse without login */}
          <Pressable
            onPress={() => router.push("/(tabs)")}
            disabled={busy}
            style={{
              height: 52,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>先逛逛，暂不登录</Text>
          </Pressable>

          {/* Register link */}
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>
              还没有账号？{" "}
              <Link href="/(auth)/sign-up">
                <Text style={{ color: colors.accent, fontWeight: "500" }}>立即注册 →</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
