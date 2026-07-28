import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";
import { getErrorTranslationKey } from "@/i18n/errorMap";
import { supabase } from "@/lib/supabase";

/**
 * Narrows an unknown value to a non-empty trimmed string.
 */
function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Visual field treatment keyed by active theme pack. */
type FieldVariant = "classic" | "atelier" | "noir";

/**
 * Props for a single labelled text field on the account form.
 */
interface FieldProps {
  /** Label rendered above the input. */
  label: string;
  /** Current value. */
  value: string;
  /** Change handler. */
  onChangeText: (value: string) => void;
  /** Disables the input while a save is in flight. */
  editable: boolean;
  /** Optional placeholder. */
  placeholder?: string;
  /** Optional keyboard type. */
  keyboardType?: "default" | "phone-pad";
  /** Optional autocapitalisation behaviour. */
  autoCapitalize?: "none" | "words";
  /**
   * Theme field chrome: Classic bordered card · Atelier paper underline ·
   * Noir night-settings underline on dark ground.
   */
  variant?: FieldVariant;
}

/**
 * Reusable labelled input matching the app's form design language.
 */
function Field({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  variant = "classic",
}: Readonly<FieldProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const isUnderline = variant === "atelier" || variant === "noir";

  return (
    <View style={{ marginBottom: isUnderline ? 28 : 16 }}>
      <Text
        style={{
          fontSize: isUnderline ? 11 : 13,
          letterSpacing: isUnderline ? 1.5 : 0,
          textTransform: isUnderline ? "uppercase" : "none",
          color: tokens.muted,
          marginBottom: isUnderline ? 10 : 6,
          fontFamily: "Inter_400Regular",
        }}
      >
        {label}
      </Text>
      <TextInput
        style={
          isUnderline
            ? {
                height: 44,
                backgroundColor: "transparent",
                borderWidth: 0,
                borderBottomWidth: 1,
                borderBottomColor: tokens.border,
                borderRadius: 0,
                paddingHorizontal: 0,
                paddingVertical: 8,
                fontSize: variant === "noir" ? 15 : 16,
                color: tokens.text,
                fontFamily: "Inter_400Regular",
              }
            : {
                height: 50,
                backgroundColor: tokens.bg,
                borderWidth: 1,
                borderColor: tokens.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: tokens.text,
                fontFamily: "Inter_400Regular",
              }
        }
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={tokens.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

/**
 * Resolves the account form field variant from the active theme id.
 */
function fieldVariantForTheme(themeId: string): FieldVariant {
  if (themeId === "atelier") {
    return "atelier";
  }
  if (themeId === "noir") {
    return "noir";
  }
  return "classic";
}

/**
 * Account settings — edit the customer's name and phone number.
 * Reached from the edit control on the profile hub.
 *
 * Atelier: paper colophon form (underline fields, square CTA).
 * Noir: night-settings underline form + accent square CTA.
 * Classic: bordered card fields + pill CTA.
 */
export default function AccountSettingsScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isAtelier = themeId === "atelier";
  const isNoir = themeId === "noir";
  const fieldVariant = fieldVariantForTheme(themeId);
  const router = useRouter();
  const { t } = useTranslation();
  const { user, user_detail } = useAuthContext();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Prefill from saved profile (user_details + auth metadata). */
  useEffect(() => {
    if (isNonEmpty(user_detail?.first_name)) {
      setFirstName(String(user_detail?.first_name));
    }
    if (isNonEmpty(user_detail?.last_name)) {
      setLastName(String(user_detail?.last_name));
    }
    const meta =
      user?.user_metadata !== null &&
      user?.user_metadata !== undefined &&
      typeof user.user_metadata === "object"
        ? user.user_metadata
        : {};
    const phoneValue = meta["phone"];
    if (isNonEmpty(phoneValue)) {
      setPhone(String(phoneValue));
    }
  }, [user, user_detail]);

  /**
   * Persists name to `user_details` and name + phone to auth metadata, then
   * returns to the profile home on success.
   */
  const handleSave = async (): Promise<void> => {
    setError(null);
    if (user === null) {
      setError(t("settings.loginRequired"));
      return;
    }
    if (!isNonEmpty(firstName) || !isNonEmpty(lastName)) {
      setError(t("settings.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const trimmedPhone = phone.trim();

      const { error: detailError } = await supabase
        .from("user_details")
        .update({ first_name: trimmedFirst, last_name: trimmedLast })
        .eq("id", user.id);
      if (detailError !== null) {
        setError(t(getErrorTranslationKey(detailError.message)));
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: `${trimmedFirst} ${trimmedLast}`.trim(),
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone: trimmedPhone,
        },
      });
      if (authError !== null) {
        setError(t(getErrorTranslationKey(authError.message)));
        return;
      }

      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("settings.menuAccount")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("settings.loginToEdit")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SubPageHeader title={t("settings.menuAccount")} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: isAtelier ? 24 : 16,
            paddingTop: isAtelier ? 32 : 20,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isAtelier ? (
            <View style={{ marginBottom: 36 }}>
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 28,
                  lineHeight: 36,
                  color: tokens.text,
                  marginBottom: 8,
                }}
              >
                {t("settings.menuAccount")}
              </Text>
              {typeof user.email === "string" && user.email.length > 0 ? (
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 20,
                    color: tokens.muted,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {user.email}
                </Text>
              ) : null}
            </View>
          ) : null}

          {isNoir ? (
            <View
              style={{
                marginBottom: 24,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: tokens.border,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: tokens.muted,
                  fontFamily: "Inter_400Regular",
                  marginBottom: 4,
                }}
              >
                {t("settings.menuAccount")}
              </Text>
              {typeof user.email === "string" && user.email.length > 0 ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: tokens.text,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {user.email}
                </Text>
              ) : null}
            </View>
          ) : null}

          {error !== null ? (
            <Text style={{ fontSize: 13, color: tokens.danger, fontFamily: "Inter_400Regular", marginBottom: 16 }}>
              {error}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: isAtelier ? 20 : isNoir ? 16 : 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("settings.firstName")}
                value={firstName}
                onChangeText={setFirstName}
                editable={!saving}
                autoCapitalize="words"
                placeholder={t("settings.firstName")}
                variant={fieldVariant}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("settings.lastName")}
                value={lastName}
                onChangeText={setLastName}
                editable={!saving}
                autoCapitalize="words"
                placeholder={t("settings.lastName")}
                variant={fieldVariant}
              />
            </View>
          </View>

          <Field
            label={t("settings.phone")}
            value={phone}
            onChangeText={setPhone}
            editable={!saving}
            keyboardType="phone-pad"
            placeholder={t("settings.phonePlaceholder")}
            variant={fieldVariant}
          />
        </ScrollView>

        {/* Sticky footer CTA */}
        <View
          style={{
            backgroundColor: tokens.bg,
            borderTopWidth: 1,
            borderTopColor: tokens.border,
            paddingHorizontal: isAtelier ? 24 : 16,
            paddingTop: 12,
            paddingBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => void handleSave()}
            disabled={saving}
            activeOpacity={0.85}
            style={
              isAtelier
                ? {
                    height: 48,
                    borderWidth: 1,
                    borderColor: tokens.text,
                    borderRadius: 2,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: saving ? 0.6 : 1,
                  }
                : isNoir
                  ? {
                      height: 48,
                      backgroundColor: tokens.accent,
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: saving ? 0.6 : 1,
                    }
                  : {
                      height: 56,
                      backgroundColor: tokens.text,
                      borderRadius: 99,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: saving ? 0.6 : 1,
                    }
            }
          >
            {saving ? (
              <ActivityIndicator color={isAtelier ? tokens.text : tokens.bg} />
            ) : (
              <Text
                style={
                  isAtelier
                    ? {
                        color: tokens.text,
                        fontSize: 13,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        fontFamily: "Inter_400Regular",
                      }
                    : isNoir
                      ? {
                          color: tokens.bg,
                          fontSize: 13,
                          fontWeight: "600",
                          letterSpacing: 0.5,
                          fontFamily: "Inter_400Regular",
                        }
                      : {
                          color: tokens.bg,
                          fontSize: 16,
                          fontWeight: "600",
                          fontFamily: "Inter_400Regular",
                        }
                }
              >
                {t("settings.saveChanges")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
