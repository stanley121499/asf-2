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
import { getErrorTranslationKey } from "@/i18n/errorMap";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

/**
 * Registers a new user with email/password; sends them to sign-in.
 */
export default function SignUpScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (): Promise<void> => {
    setError(null);
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0 || password.length < 8) {
      setError(t("auth.signUp.emailPasswordRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });
      if (signUpErr !== null) {
        setError(t(getErrorTranslationKey(signUpErr.message)));
        return;
      }
      router.replace("/(auth)/sign-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 24,
            color: colors.text,
            marginBottom: 8,
          }}
        >
          {t("auth.signUp.title")}
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24, fontFamily: "Inter_400Regular" }}>
          {t("auth.signUp.subtitle")}
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
            <Text style={{ fontSize: 14, color: colors.danger, fontFamily: "Inter_400Regular" }}>{error}</Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
          {t("auth.signUp.name")}
        </Text>
        <TextInput
          style={{
            marginBottom: 16,
            height: 52,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.panel,
            paddingHorizontal: 16,
            fontSize: 16,
            color: colors.text,
            fontFamily: "Inter_400Regular",
          }}
          placeholder={t("auth.signUp.namePlaceholder")}
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          editable={!submitting}
        />

        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
          {t("auth.signUp.email")}
        </Text>
        <TextInput
          style={{
            marginBottom: 16,
            height: 52,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.panel,
            paddingHorizontal: 16,
            fontSize: 16,
            color: colors.text,
            fontFamily: "Inter_400Regular",
          }}
          placeholder={t("auth.signUp.emailPlaceholder")}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!submitting}
        />

        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
          {t("auth.signUp.password")}
        </Text>
        <TextInput
          style={{
            marginBottom: 24,
            height: 52,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.panel,
            paddingHorizontal: 16,
            fontSize: 16,
            color: colors.text,
            fontFamily: "Inter_400Regular",
          }}
          placeholder={t("auth.signUp.passwordMinPlaceholder")}
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!submitting}
        />

        <Pressable
          onPress={() => void onSubmit()}
          disabled={submitting}
          style={{
            height: 56,
            borderRadius: 12,
            backgroundColor: "#000000",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              {t("auth.signUp.submit")}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/sign-in")} disabled={submitting}>
          <Text style={{ textAlign: "center", fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }}>
            {t("auth.signUp.backToSignIn")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
