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

import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { getErrorTranslationKey } from "@/i18n/errorMap";
import { supabase } from "@/lib/supabase";

/**
 * Sends a Supabase password reset email.
 */
export default function ForgotPasswordScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (): Promise<void> => {
    setError(null);
    const trimmed = email.trim();
    if (trimmed.length === 0) {
      setError(t("auth.forgotPassword.emailRequired"));
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
        setError(t(getErrorTranslationKey(resetErr.message)));
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 24,
            color: tokens.text,
            marginBottom: 8,
          }}
        >
          {t("auth.forgotPassword.title")}
        </Text>
        <Text style={{ fontSize: 14, color: tokens.muted, marginBottom: 24, fontFamily: "Inter_400Regular" }}>
          {t("auth.forgotPassword.subtitle")}
        </Text>

        {error !== null ? (
          <View
            style={{
              marginBottom: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#FECACA",
              backgroundColor: "#FEF2F2",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: tokens.danger, fontFamily: "Inter_400Regular" }}>{error}</Text>
          </View>
        ) : null}

        {done ? (
          <Text style={{ color: tokens.text, marginBottom: 24, fontFamily: "Inter_400Regular", fontSize: 15 }}>
            {t("auth.forgotPassword.success")}
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: 14, fontWeight: "500", color: tokens.text, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
              {t("auth.forgotPassword.email")}
            </Text>
            <TextInput
              style={{
                marginBottom: 24,
                height: 52,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                backgroundColor: tokens.panel,
                paddingHorizontal: 16,
                fontSize: 16,
                color: tokens.text,
                fontFamily: "Inter_400Regular",
              }}
              placeholder={t("auth.forgotPassword.emailPlaceholder")}
              placeholderTextColor={tokens.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!submitting}
            />

            <Pressable
              onPress={() => void onSubmit()}
              disabled={submitting}
              style={{
                height: 56,
                borderRadius: 12,
                backgroundColor: tokens.text,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color={tokens.bg} />
              ) : (
                <Text style={{ color: tokens.bg, fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                  {t("auth.forgotPassword.submit")}
                </Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.push("/(auth)/sign-in")} disabled={submitting}>
          <Text style={{ textAlign: "center", fontSize: 14, color: tokens.text, fontFamily: "Inter_400Regular" }}>
            {t("auth.forgotPassword.backToSignIn")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
