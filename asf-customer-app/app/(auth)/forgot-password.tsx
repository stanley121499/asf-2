import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

/**
 * Sends a Supabase password reset email.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (): Promise<void> => {
    setError(null);
    const trimmed = email.trim();
    if (trimmed.length === 0) {
      setError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const appUrl = process.env.EXPO_PUBLIC_APP_URL ?? "";
      const redirectTo =
        appUrl.length > 0
          ? `${appUrl.replace(/\/$/, "")}/authentication/reset-password`
          : undefined;

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        redirectTo !== undefined ? { redirectTo } : undefined
      );
      if (resetErr !== null) {
        setError(resetErr.message);
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-accent mb-2">Reset password</Text>
        <Text className="text-muted text-sm mb-6">We will email you a reset link</Text>

        {error !== null ? (
          <View className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        ) : null}

        {done ? (
          <Text className="text-accent mb-6">请检查您的邮箱，重置密码链接已发送。</Text>
        ) : (
          <>
            <Text className="text-sm font-medium text-accent mb-1">Email</Text>
            <TextInput
              className="mb-6 rounded-xl border border-border bg-panel px-4 py-3 text-accent"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!submitting}
            />

            <Pressable
              className="rounded-xl bg-accent py-4 items-center mb-4"
              onPress={() => void onSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FAF9F6" />
              ) : (
                <Text className="text-bg font-semibold">Send reset link</Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.back()} disabled={submitting}>
          <Text className="text-center text-sm text-accent">Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
