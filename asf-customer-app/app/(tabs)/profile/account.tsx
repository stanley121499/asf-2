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
import { getErrorTranslationKey } from "@/i18n/errorMap";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

/**
 * Narrows an unknown value to a non-empty trimmed string.
 */
function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

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
}: Readonly<FieldProps>): React.ReactElement {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
        {label}
      </Text>
      <TextInput
        style={{
          height: 50,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          fontSize: 15,
          color: colors.text,
          fontFamily: "Inter_400Regular",
        }}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

/**
 * Account settings — edit the customer's name and phone number.
 * Reached from the edit icon in the top-right of the profile header.
 */
export default function AccountSettingsScreen(): React.ReactElement {
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
    const meta = (user?.user_metadata as Record<string, unknown> | undefined) ?? {};
    if (isNonEmpty(meta["phone"])) {
      setPhone(String(meta["phone"]));
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
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title={t("settings.menuAccount")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("settings.loginToEdit")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubPageHeader title={t("settings.menuAccount")} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {error !== null ? (
            <Text style={{ fontSize: 13, color: colors.danger, fontFamily: "Inter_400Regular", marginBottom: 16 }}>
              {error}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("settings.firstName")}
                value={firstName}
                onChangeText={setFirstName}
                editable={!saving}
                autoCapitalize="words"
                placeholder={t("settings.firstName")}
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
          />
        </ScrollView>

        {/* Sticky footer CTA */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => void handleSave()}
            disabled={saving}
            activeOpacity={0.85}
            style={{
              height: 56,
              backgroundColor: "#000000",
              borderRadius: 99,
              alignItems: "center",
              justifyContent: "center",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                {t("settings.saveChanges")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
