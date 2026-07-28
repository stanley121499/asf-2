import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { getCheckoutApiErrorTranslationKey } from "@/i18n/errorMap";
import {
  buildFlatFallbackRate,
  postCreatePendingOrder,
  postDeliveryRates,
  type DeliveryRateOption,
  type ShippingAddressStructured,
} from "@/lib/checkoutApi";
import { formatRm } from "@/lib/formatCurrency";
import { loadSavedShippingAddress, saveShippingAddress } from "@/lib/shippingAddressStorage";

/**
 * Props for a single labelled text field in the checkout form.
 */
interface FieldProps {
  /** Field label shown above the input. */
  label: string;
  /** Current input value. */
  value: string;
  /** Change handler. */
  onChangeText: (value: string) => void;
  /** Whether the field is editable (disabled while submitting). */
  editable: boolean;
  /** Optional placeholder text. */
  placeholder?: string;
  /** Optional keyboard type. */
  keyboardType?: "default" | "phone-pad";
  /** Optional autocapitalisation behaviour. */
  autoCapitalize?: "none" | "words" | "characters";
  /** When true, the field is greyed out (e.g. fixed country). */
  muted?: boolean;
}

/**
 * Reusable labelled text input matching the app's form design language
 * (muted label, white field, dark text, rounded border).
 */
function Field({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  muted = false,
}: Readonly<FieldProps>): React.ReactElement {
  const tokens = useThemeTokens();
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
        {label}
      </Text>
      <TextInput
        style={{
          height: 50,
          backgroundColor: muted ? tokens.panel : tokens.bg,
          borderWidth: 1,
          borderColor: tokens.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          fontSize: 15,
          color: muted ? tokens.muted : tokens.text,
          fontFamily: "Inter_400Regular",
        }}
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
 * Formats ETA days for display on a courier option row.
 */
function formatEtaDays(
  etaDays: number | null,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (etaDays === null || !Number.isFinite(etaDays)) {
    return "";
  }
  if (etaDays <= 1) {
    return t("checkout.etaWithinOneDay");
  }
  return t("checkout.etaDays", { count: Math.round(etaDays) });
}

/**
 * Selectable courier / delivery method row.
 */
function CourierMethodRow({
  option,
  selected,
  onPress,
  t,
}: Readonly<{
  option: DeliveryRateOption;
  selected: boolean;
  onPress: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}>): React.ReactElement {
  const tokens = useThemeTokens();
  const etaLabel = formatEtaDays(option.etaDays, t);
  const displayName =
    option.serviceCode === "FLAT_STANDARD" ? t("checkout.flatRateName") : option.name;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: selected ? tokens.text : tokens.border,
        backgroundColor: tokens.bg,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: tokens.panel,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="cube-outline" size={20} color={tokens.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: tokens.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
          {displayName}
        </Text>
        {etaLabel.length > 0 ? (
          <Text style={{ fontSize: 12, color: tokens.muted, fontFamily: "Inter_400Regular", marginTop: 2 }}>
            {etaLabel}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 15, color: tokens.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
        {formatRm(option.price)}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: selected ? 7 : 2,
          borderColor: selected ? tokens.text : tokens.border,
        }}
      />
    </TouchableOpacity>
  );
}

/**
 * Step 1: shipping address → courier choice → pending order → payment screen.
 */
export default function CheckoutShippingScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled("cart")) {
    return <Redirect href="/(tabs)" />;
  }
  const { promoCode: promoCodeParam, promotionId: promotionIdParam, warrantyCreditId: warrantyCreditIdParam } = useLocalSearchParams<{
    promoCode?: string;
    promotionId?: string;
    warrantyCreditId?: string;
  }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("Malaysia");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressLoaded, setAddressLoaded] = useState(false);

  const [deliveryRates, setDeliveryRates] = useState<DeliveryRateOption[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string | null>(null);

  /** Pre-fill from saved profile (user_details + auth metadata) once per session. */
  useEffect(() => {
    if (user === null || addressLoaded) {
      return;
    }

    let cancelled = false;

    void (async (): Promise<void> => {
      const saved = await loadSavedShippingAddress(user);
      if (cancelled) {
        return;
      }
      setFirstName(saved.firstName);
      setLastName(saved.lastName);
      setAddress1(saved.address1);
      setAddress2(saved.address2);
      setCity(saved.city);
      setStateRegion(saved.stateRegion);
      setPostcode(saved.postcode);
      setCountry(saved.country);
      setRecipientPhone(saved.recipientPhone);
      setAddressLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [addressLoaded, user]);

  const structured = useMemo((): ShippingAddressStructured | null => {
    const recipientName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const s: ShippingAddressStructured = {
      address1: address1.trim(),
      address2: address2.trim(),
      city: city.trim(),
      state: stateRegion.trim(),
      postcode: postcode.trim(),
      country: country.trim(),
      recipientName,
      recipientPhone: recipientPhone.trim(),
    };
    if (
      s.address1.length === 0 ||
      s.city.length === 0 ||
      s.state.length === 0 ||
      s.postcode.length === 0 ||
      s.country.length === 0 ||
      s.recipientName.length === 0 ||
      s.recipientPhone.length === 0
    ) {
      return null;
    }
    return s;
  }, [address1, address2, city, stateRegion, postcode, country, firstName, lastName, recipientPhone]);

  const shippingDisplay = useMemo(() => {
    if (structured === null) {
      return "";
    }
    return [
      structured.recipientName,
      structured.address1,
      structured.address2,
      `${structured.city}, ${structured.state} ${structured.postcode}`,
      structured.country,
      t("checkout.phonePrefix", { phone: structured.recipientPhone }),
    ]
      .filter((line) => line.length > 0)
      .join("\n");
  }, [structured, t]);

  /** Fetch live courier rates when the structured address becomes valid (debounced). */
  useEffect(() => {
    if (user === null || structured === null) {
      setDeliveryRates([]);
      setSelectedServiceCode(null);
      setRatesError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async (): Promise<void> => {
        setRatesLoading(true);
        setRatesError(null);
        try {
          const rates = await postDeliveryRates({
            userId: user.id,
            destination: {
              address1: structured.address1,
              city: structured.city,
              state: structured.state,
              postcode: structured.postcode,
              country: structured.country,
            },
          });
          if (cancelled) {
            return;
          }
          const options = rates.length > 0 ? rates : [buildFlatFallbackRate()];
          setDeliveryRates(options);
          setSelectedServiceCode((prev) => {
            if (prev !== null && options.some((o) => o.serviceCode === prev)) {
              return prev;
            }
            return options[0]?.serviceCode ?? null;
          });
        } catch (e) {
          if (cancelled) {
            return;
          }
          const fallback = buildFlatFallbackRate();
          setDeliveryRates([fallback]);
          setSelectedServiceCode(fallback.serviceCode);
          const raw = e instanceof Error ? e.message : "Could not fetch delivery rates";
          setRatesError(t(getCheckoutApiErrorTranslationKey(raw)));
        } finally {
          if (!cancelled) {
            setRatesLoading(false);
          }
        }
      })();
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [structured, user, t]);

  const onContinue = async (): Promise<void> => {
    setError(null);
    if (user === null) {
      setError(t("checkout.loginRequired"));
      return;
    }
    if (structured === null || shippingDisplay.length === 0) {
      setError(t("checkout.fillRequiredFields"));
      return;
    }
    if (selectedServiceCode === null || selectedServiceCode.length === 0) {
      setError(t("checkout.selectDeliveryMethod"));
      return;
    }

    setSubmitting(true);
    try {
      await saveShippingAddress(user.id, structured, firstName, lastName);

      const promoCode =
        typeof promoCodeParam === "string" && promoCodeParam.trim().length > 0
          ? promoCodeParam.trim()
          : undefined;
      const promotionId =
        typeof promotionIdParam === "string" && promotionIdParam.trim().length > 0
          ? promotionIdParam.trim()
          : undefined;
      const warrantyCreditId =
        typeof warrantyCreditIdParam === "string" && warrantyCreditIdParam.trim().length > 0
          ? warrantyCreditIdParam.trim()
          : undefined;

      const orderId = await postCreatePendingOrder({
        userId: user.id,
        shipping_address: shippingDisplay,
        shipping_address_structured: structured,
        promoCode,
        promotionId,
        warrantyCreditId,
        serviceCode: selectedServiceCode,
      });

      router.push({
        pathname: "/checkout/payment",
        params: { orderId },
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Could not create pending order";
      setError(t(getCheckoutApiErrorTranslationKey(raw)));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={tokens.text} />
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
        <Header onBack={() => router.back()} title={t("checkout.shippingInfo")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: tokens.muted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
            {t("checkout.loginRequired")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
      <Header onBack={() => router.back()} title={t("checkout.shippingInfo")} />

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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#F2C9C6",
                backgroundColor: "#FCEDEC",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Ionicons name="alert-circle-outline" size={18} color={tokens.danger} />
              <Text style={{ flex: 1, fontSize: 13, color: tokens.danger, fontFamily: "Inter_400Regular" }}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Recipient section */}
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 18,
              color: tokens.text,
              marginBottom: 14,
            }}
          >
            {t("checkout.recipientSection")}
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("checkout.firstName")}
                value={firstName}
                onChangeText={setFirstName}
                editable={!submitting}
                autoCapitalize="words"
                placeholder={t("checkout.firstName")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("checkout.lastName")}
                value={lastName}
                onChangeText={setLastName}
                editable={!submitting}
                autoCapitalize="words"
                placeholder={t("checkout.lastName")}
              />
            </View>
          </View>

          <Field
            label={t("checkout.phoneLabelShort")}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            editable={!submitting}
            keyboardType="phone-pad"
            placeholder="010-0000000"
          />

          {/* Address section */}
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 18,
              color: tokens.text,
              marginTop: 12,
              marginBottom: 14,
            }}
          >
            {t("checkout.addressSection")}
          </Text>

          <Field
            label={t("checkout.address1")}
            value={address1}
            onChangeText={setAddress1}
            editable={!submitting}
            placeholder={t("checkout.address1Placeholder")}
          />

          <Field
            label={t("checkout.address2")}
            value={address2}
            onChangeText={setAddress2}
            editable={!submitting}
            placeholder={t("checkout.address2Placeholder")}
          />

          <Field
            label={t("checkout.city")}
            value={city}
            onChangeText={setCity}
            editable={!submitting}
            placeholder={t("checkout.city")}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1.4 }}>
              <Field
                label={t("checkout.state")}
                value={stateRegion}
                onChangeText={setStateRegion}
                editable={!submitting}
                placeholder={t("checkout.state")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("checkout.postalCode")}
                value={postcode}
                onChangeText={setPostcode}
                editable={!submitting}
                keyboardType="phone-pad"
                placeholder={t("checkout.postalCode")}
              />
            </View>
          </View>

          <Field
            label={t("checkout.country")}
            value={country}
            onChangeText={setCountry}
            editable={false}
            muted
          />

          {/* Delivery method section — shown once address is complete */}
          {structured !== null ? (
            <>
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 18,
                  color: tokens.text,
                  marginTop: 12,
                  marginBottom: 14,
                }}
              >
                {t("checkout.deliveryMethod")}
              </Text>

              {ratesLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color={tokens.text} />
                  <Text style={{ fontSize: 13, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
                    {t("checkout.ratesLoading")}
                  </Text>
                </View>
              ) : null}

              {ratesError !== null ? (
                <Text style={{ fontSize: 12, color: tokens.muted, fontFamily: "Inter_400Regular", marginBottom: 10 }}>
                  {`${ratesError}${t("checkout.ratesFallbackSuffix")}`}
                </Text>
              ) : null}

              <View style={{ gap: 10 }}>
                {deliveryRates.map((option) => (
                  <CourierMethodRow
                    key={option.serviceCode}
                    option={option}
                    selected={selectedServiceCode === option.serviceCode}
                    onPress={() => setSelectedServiceCode(option.serviceCode)}
                    t={t}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>

        {/* Sticky footer CTA */}
        <SafeAreaView
          edges={["bottom"]}
          style={{
            backgroundColor: tokens.bg,
            borderTopWidth: 1,
            borderTopColor: tokens.border,
            paddingHorizontal: 16,
            paddingTop: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => void onContinue()}
            disabled={submitting || ratesLoading || selectedServiceCode === null}
            activeOpacity={0.85}
            style={{
              height: 56,
              backgroundColor: tokens.text,
              borderRadius: 99,
              alignItems: "center",
              justifyContent: "center",
              opacity: submitting || ratesLoading || selectedServiceCode === null ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color={tokens.bg} />
            ) : (
              <Text style={{ color: tokens.bg, fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                {t("checkout.continueToPayment")}
              </Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Sticky checkout header with a back arrow and centered Playfair title.
 */
function Header({
  onBack,
  title,
}: Readonly<{ onBack: () => void; title: string }>): React.ReactElement {
  const tokens = useThemeTokens();
  return (
    <View
      style={{
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        backgroundColor: tokens.bg,
        position: "relative",
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        hitSlop={8}
        style={{ position: "absolute", left: 16, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name="arrow-back" size={22} color={tokens.text} />
      </TouchableOpacity>
      <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: tokens.text }}>
        {title}
      </Text>
    </View>
  );
}
