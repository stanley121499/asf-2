import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ClaimEvidencePicker } from "@/components/claims/ClaimEvidencePicker";
import { PressableScale } from "@/components/motion";
import { SubPageHeader } from "@/components/SubPageHeader";
import { useAlertContext } from "@/context/AlertContext";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useStoreLocationContext } from "@/context/StoreLocationContext";
import { useWarrantyRegistrationContext } from "@/context/WarrantyRegistrationContext";
import { useThemeTokens } from "@/context/ThemeContext";
import {
  createClaimEvidenceSessionId,
  uploadClaimEvidencePhoto,
} from "@/lib/claims/claimEvidenceStorage";
import type { PickedClaimPhoto } from "@/lib/claims/pickClaimPhotos";
import { hapticSuccess } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";
import { normalizeActivationCode } from "@/lib/warranty/normalizeActivationCode";

/**
 * Feature flag: dedicated `warranty_registration` (not `claims`).
 * See FeatureFlagsContext + collection list screen.
 */
const FEATURE_FLAG_KEY = "warranty_registration" as const;

const PURCHASE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Module-level guard so Strict Mode remounts do not re-fire activate success haptic. */
let activateSuccessHapticFired = false;

/**
 * Narrows an unknown value to a non-empty trimmed string.
 */
function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Returns today's calendar date as YYYY-MM-DD in local time.
 */
function todayLocalIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Validates a YYYY-MM-DD purchase date (exists, not in the future).
 */
function isValidPurchaseDate(raw: string): boolean {
  if (!PURCHASE_DATE_PATTERN.test(raw)) {
    return false;
  }
  const parts = raw.split("-");
  if (parts.length !== 3) {
    return false;
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return false;
  }
  return raw <= todayLocalIsoDate();
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words" | "characters";
  optional?: boolean;
}

/**
 * Labelled text field matching account / claims form styling.
 */
function Field({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  optional = false,
}: Readonly<FieldProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          color: tokens.muted,
          marginBottom: 6,
          fontFamily: "Inter_400Regular",
        }}
      >
        {optional ? `${label} (${t("collection.optional")})` : label}
      </Text>
      <TextInput
        style={{
          height: 50,
          backgroundColor: tokens.bg,
          borderWidth: 1,
          borderColor: tokens.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          fontSize: 15,
          color: tokens.text,
          fontFamily: "Inter_400Regular",
        }}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={tokens.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

/**
 * Activate-success ceremony — check scale-in + accent ring + {@link hapticSuccess} once.
 */
function ActivateSuccessCeremony({
  title,
  message,
  onContinue,
  continueLabel,
}: Readonly<{
  title: string;
  message: string;
  onContinue: () => void;
  continueLabel: string;
}>): React.ReactElement {
  const tokens = useThemeTokens();
  const scale = useSharedValue(activateSuccessHapticFired ? 1 : 0.6);

  useEffect(() => {
    if (activateSuccessHapticFired) {
      return;
    }
    activateSuccessHapticFired = true;
    scale.value = withTiming(1, {
      duration: motion.duration.entrance,
      easing: motionEasing,
    });
    void hapticSuccess();
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: tokens.panel }}>
      <SubPageHeader title={title} />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Animated.View
          style={[
            {
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(201, 169, 110, 0.16)",
              borderWidth: 1.5,
              borderColor: tokens.accent,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            },
            animatedStyle,
          ]}
        >
          <Ionicons name="checkmark-circle" size={44} color={tokens.success} />
        </Animated.View>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 22,
            color: tokens.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {message}
        </Text>
        <PressableScale
          haptic="medium"
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={continueLabel}
          centerContent
          style={{
            marginTop: 28,
            height: 52,
            paddingHorizontal: 32,
            backgroundColor: tokens.text,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            minWidth: 220,
          }}
        >
          <Text
            style={{
              color: tokens.bg,
              fontSize: 15,
              fontFamily: "Inter_400Regular",
            }}
          >
            {continueLabel}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

/**
 * Activate a physical warranty card — requires login; submits to Next activate API.
 */
export default function CollectionActivateScreen(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();

  if (!isEnabled(FEATURE_FLAG_KEY)) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <CollectionActivateContent title={t("collection.activateTitle")} />;
}

/**
 * Inner activate form — only mounts when the feature flag provider tree is on.
 */
function CollectionActivateContent({
  title,
}: Readonly<{ title: string }>): React.ReactElement {
  const tokens = useThemeTokens();
  const router = useRouter();
  const { t } = useTranslation();
  const { showAlert } = useAlertContext();
  const { user, user_detail, loading: authLoading } = useAuthContext();
  const { storeLocations, loading: storesLoading } = useStoreLocationContext();
  const { activateRegistration } = useWarrantyRegistrationContext();

  const [code, setCode] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayLocalIsoDate());
  const [purchaseStoreId, setPurchaseStoreId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [staffName, setStaffName] = useState("");
  const [receiptPhotos, setReceiptPhotos] = useState<PickedClaimPhoto[]>([]);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activateSucceeded, setActivateSucceeded] = useState(false);

  useEffect(() => {
    if (user === null) {
      return;
    }
    const first = isNonEmpty(user_detail?.first_name)
      ? String(user_detail?.first_name).trim()
      : "";
    const last = isNonEmpty(user_detail?.last_name)
      ? String(user_detail?.last_name).trim()
      : "";
    const joined = `${first} ${last}`.trim();
    if (joined.length > 0) {
      setCustomerName(joined);
    }
    if (isNonEmpty(user.email)) {
      setCustomerEmail(String(user.email).trim());
    }
    const meta =
      typeof user.user_metadata === "object" && user.user_metadata !== null
        ? (user.user_metadata as Record<string, unknown>)
        : {};
    if (isNonEmpty(meta["phone"])) {
      setCustomerPhone(String(meta["phone"]).trim());
    }
  }, [user, user_detail]);

  const selectedStoreName = useMemo((): string => {
    if (purchaseStoreId === null) {
      return t("collection.selectStore");
    }
    const found = storeLocations.find((s) => s.id === purchaseStoreId);
    if (found === undefined) {
      return t("collection.selectStore");
    }
    return found.name;
  }, [purchaseStoreId, storeLocations, t]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.panel }}>
        <SubPageHeader title={title} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  if (user === null) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  /**
   * Validates form fields, optionally uploads one receipt photo, then activates.
   */
  const handleSubmit = async (): Promise<void> => {
    if (submitting) {
      return;
    }

    const normalizedCode = normalizeActivationCode(code);
    if (normalizedCode.length === 0) {
      showAlert(t("collection.errors.codeRequired"), "warning");
      return;
    }
    if (!isValidPurchaseDate(purchaseDate.trim())) {
      showAlert(t("collection.errors.purchaseDateInvalid"), "warning");
      return;
    }
    if (purchaseStoreId === null) {
      showAlert(t("collection.errors.storeRequired"), "warning");
      return;
    }
    if (!isNonEmpty(customerName)) {
      showAlert(t("collection.errors.nameRequired"), "warning");
      return;
    }
    if (!isNonEmpty(customerEmail)) {
      showAlert(t("collection.errors.emailRequired"), "warning");
      return;
    }
    if (!isNonEmpty(customerPhone)) {
      showAlert(t("collection.errors.phoneRequired"), "warning");
      return;
    }

    setSubmitting(true);
    try {
      let receiptUrl: string | null = null;
      const firstPhoto = receiptPhotos[0];
      if (firstPhoto !== undefined) {
        const sessionId = createClaimEvidenceSessionId();
        try {
          receiptUrl = await uploadClaimEvidencePhoto(
            firstPhoto.uri,
            user.id,
            sessionId,
            firstPhoto.mimeType
          );
        } catch (uploadErr) {
          const uploadMessage =
            uploadErr instanceof Error
              ? uploadErr.message
              : t("collection.errors.uploadFailed");
          showAlert(uploadMessage, "error");
          return;
        }
      }

      const staffTrimmed = staffName.trim();
      const result = await activateRegistration({
        code: normalizedCode,
        purchaseDate: purchaseDate.trim(),
        purchaseStoreId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        staffName: staffTrimmed.length > 0 ? staffTrimmed : null,
        receiptUrl,
      });

      if (result.ok === false) {
        const mapped = mapActivateError(result.error, result.message, t);
        showAlert(mapped, "error");
        return;
      }

      setActivateSucceeded(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (activateSucceeded) {
    return (
      <ActivateSuccessCeremony
        title={title}
        message={t("collection.activateSuccess")}
        continueLabel={t("settings.menuCollection")}
        onContinue={() => {
          router.replace("/(tabs)/profile/collection");
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.panel }}>
      <SubPageHeader title={title} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: 14,
              color: tokens.muted,
              marginBottom: 20,
              lineHeight: 20,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("collection.activateIntro")}
          </Text>

          <Field
            label={t("collection.fields.code")}
            value={code}
            onChangeText={setCode}
            editable={!submitting}
            placeholder={t("collection.fields.codePlaceholder")}
            autoCapitalize="characters"
          />

          <Field
            label={t("collection.fields.purchaseDate")}
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            editable={!submitting}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                color: tokens.muted,
                marginBottom: 6,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("collection.fields.purchaseStore")}
            </Text>
            <TouchableOpacity
              onPress={() => setStoreModalVisible(true)}
              disabled={submitting || storesLoading}
              activeOpacity={0.7}
              style={{
                height: 50,
                backgroundColor: tokens.bg,
                borderWidth: 1,
                borderColor: tokens.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color:
                    purchaseStoreId === null ? tokens.muted : tokens.text,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {storesLoading ? t("common.loading") : selectedStoreName}
              </Text>
            </TouchableOpacity>
          </View>

          <Field
            label={t("collection.fields.customerName")}
            value={customerName}
            onChangeText={setCustomerName}
            editable={!submitting}
            autoCapitalize="words"
          />
          <Field
            label={t("collection.fields.customerEmail")}
            value={customerEmail}
            onChangeText={setCustomerEmail}
            editable={!submitting}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label={t("collection.fields.customerPhone")}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            editable={!submitting}
            keyboardType="phone-pad"
            placeholder={t("settings.phonePlaceholder")}
          />
          <Field
            label={t("collection.fields.staffName")}
            value={staffName}
            onChangeText={setStaffName}
            editable={!submitting}
            autoCapitalize="words"
            optional
          />

          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              marginBottom: 8,
              fontFamily: "Inter_400Regular",
            }}
          >
            {`${t("collection.fields.receipt")} (${t("collection.optional")})`}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: tokens.muted,
              marginBottom: 10,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("collection.fields.receiptHint")}
          </Text>
          <ClaimEvidencePicker
            photos={receiptPhotos.slice(0, 1)}
            onChange={(next) => setReceiptPhotos(next.slice(0, 1))}
            disabled={submitting}
          />

          <PressableScale
            haptic="medium"
            onPress={() => {
              void handleSubmit();
            }}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={t("collection.submitActivate")}
            centerContent
            style={{
              marginTop: 28,
              height: 52,
              backgroundColor: submitting ? tokens.muted : tokens.text,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {submitting ? (
              <ActivityIndicator color={tokens.bg} />
            ) : (
              <Text
                style={{
                  color: tokens.bg,
                  fontSize: 15,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("collection.submitActivate")}
              </Text>
            )}
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={storeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStoreModalVisible(false)}
      >
        <Pressable
          onPress={() => setStoreModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: tokens.bg,
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: tokens.border,
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: tokens.border,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 18,
                  color: tokens.text,
                }}
              >
                {t("collection.fields.purchaseStore")}
              </Text>
            </View>
            <ScrollView>
              {storeLocations.length === 0 ? (
                <Text
                  style={{
                    padding: 20,
                    fontSize: 14,
                    color: tokens.muted,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {t("collection.noStores")}
                </Text>
              ) : (
                storeLocations.map((store, index) => (
                  <TouchableOpacity
                    key={store.id}
                    onPress={() => {
                      setPurchaseStoreId(store.id);
                      setStoreModalVisible(false);
                    }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      borderBottomWidth:
                        index === storeLocations.length - 1 ? 0 : 1,
                      borderBottomColor: tokens.border,
                      backgroundColor:
                        purchaseStoreId === store.id ? tokens.panel : tokens.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: tokens.text,
                        fontFamily: "Inter_400Regular",
                      }}
                    >
                      {store.name}
                    </Text>
                    {isNonEmpty(store.city) ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: tokens.muted,
                          marginTop: 4,
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        {store.city}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setStoreModalVisible(false)}
              style={{
                alignItems: "center",
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: tokens.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: tokens.muted,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("common.close")}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Maps activate API error codes to localized user-facing messages.
 */
function mapActivateError(
  errorCode: string,
  fallbackMessage: string,
  t: (key: string) => string
): string {
  switch (errorCode) {
    case "CODE_INVALID":
      return t("collection.errors.codeInvalid");
    case "CODE_USED":
      return t("collection.errors.codeUsed");
    case "STORE_INVALID":
      return t("collection.errors.storeInvalid");
    case "PRODUCT_PRICE_MISSING":
      return t("collection.errors.productPriceMissing");
    case "INELIGIBLE":
      return t("collection.errors.ineligible");
    default:
      return fallbackMessage.length > 0
        ? fallbackMessage
        : t("collection.errors.generic");
  }
}
