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
import {
  buildFlatFallbackRate,
  postCreatePendingOrder,
  postDeliveryRates,
  type DeliveryRateOption,
  type ShippingAddressStructured,
} from "@/lib/checkoutApi";
import { formatRm } from "@/lib/formatCurrency";
import { loadSavedShippingAddress, saveShippingAddress } from "@/lib/shippingAddressStorage";
import { colors } from "@/constants/theme";

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
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          color: colors.muted,
          marginBottom: 6,
          fontFamily: "Inter_400Regular",
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          height: 50,
          backgroundColor: muted ? colors.panel : "#FFFFFF",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          fontSize: 15,
          color: muted ? colors.muted : colors.text,
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
 * Formats ETA days for display on a courier option row.
 */
function formatEtaDays(etaDays: number | null): string {
  if (etaDays === null || !Number.isFinite(etaDays)) {
    return "";
  }
  if (etaDays <= 1) {
    return "预计 1 天内送达";
  }
  return `预计 ${Math.round(etaDays)} 天送达`;
}

/**
 * Selectable courier / delivery method row.
 */
function CourierMethodRow({
  option,
  selected,
  onPress,
}: Readonly<{
  option: DeliveryRateOption;
  selected: boolean;
  onPress: () => void;
}>): React.ReactElement {
  const etaLabel = formatEtaDays(option.etaDays);
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
        borderColor: selected ? colors.text : colors.border,
        backgroundColor: "#FFFFFF",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.panel,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="cube-outline" size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
          {option.name}
        </Text>
        {etaLabel.length > 0 ? (
          <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular", marginTop: 2 }}>
            {etaLabel}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
        {formatRm(option.price)}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: selected ? 7 : 2,
          borderColor: selected ? colors.text : colors.border,
        }}
      />
    </TouchableOpacity>
  );
}

/**
 * Step 1: shipping address → courier choice → pending order → payment screen.
 */
export default function CheckoutShippingScreen(): React.ReactElement {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled("cart")) {
    return <Redirect href="/(tabs)" />;
  }
  const { promoCode: promoCodeParam, promotionId: promotionIdParam } = useLocalSearchParams<{
    promoCode?: string;
    promotionId?: string;
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
      `电话：${structured.recipientPhone}`,
    ]
      .filter((line) => line.length > 0)
      .join("\n");
  }, [structured]);

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
          setRatesError(e instanceof Error ? e.message : "无法获取配送报价");
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
  }, [structured, user]);

  const onContinue = async (): Promise<void> => {
    setError(null);
    if (user === null) {
      setError("请先登录。");
      return;
    }
    if (structured === null || shippingDisplay.length === 0) {
      setError("请填写所有必填收货信息。");
      return;
    }
    if (selectedServiceCode === null || selectedServiceCode.length === 0) {
      setError("请选择配送方式。");
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

      const orderId = await postCreatePendingOrder({
        userId: user.id,
        shipping_address: shippingDisplay,
        shipping_address_structured: structured,
        promoCode,
        promotionId,
        serviceCode: selectedServiceCode,
      });

      router.push({
        pathname: "/checkout/payment",
        params: { orderId },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "创建订单失败";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
            请先登录后继续结账。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header onBack={() => router.back()} />

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
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={{ flex: 1, fontSize: 13, color: colors.danger, fontFamily: "Inter_400Regular" }}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Recipient section */}
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 18,
              color: colors.text,
              marginBottom: 14,
            }}
          >
            收货人
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="名"
                value={firstName}
                onChangeText={setFirstName}
                editable={!submitting}
                autoCapitalize="words"
                placeholder="名"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="姓"
                value={lastName}
                onChangeText={setLastName}
                editable={!submitting}
                autoCapitalize="words"
                placeholder="姓"
              />
            </View>
          </View>

          <Field
            label="电话"
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
              color: colors.text,
              marginTop: 12,
              marginBottom: 14,
            }}
          >
            收货地址
          </Text>

          <Field
            label="地址第一行"
            value={address1}
            onChangeText={setAddress1}
            editable={!submitting}
            placeholder="街道、门牌号"
          />

          <Field
            label="地址第二行（选填）"
            value={address2}
            onChangeText={setAddress2}
            editable={!submitting}
            placeholder="单元、楼层（选填）"
          />

          <Field
            label="城市"
            value={city}
            onChangeText={setCity}
            editable={!submitting}
            placeholder="城市"
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1.4 }}>
              <Field
                label="州 / 省"
                value={stateRegion}
                onChangeText={setStateRegion}
                editable={!submitting}
                placeholder="州 / 省"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="邮编"
                value={postcode}
                onChangeText={setPostcode}
                editable={!submitting}
                keyboardType="phone-pad"
                placeholder="邮编"
              />
            </View>
          </View>

          <Field
            label="国家"
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
                  color: colors.text,
                  marginTop: 12,
                  marginBottom: 14,
                }}
              >
                配送方式
              </Text>

              {ratesLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>
                    正在获取配送报价…
                  </Text>
                </View>
              ) : null}

              {ratesError !== null ? (
                <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular", marginBottom: 10 }}>
                  {ratesError}（已使用标准配送）
                </Text>
              ) : null}

              <View style={{ gap: 10 }}>
                {deliveryRates.map((option) => (
                  <CourierMethodRow
                    key={option.serviceCode}
                    option={option}
                    selected={selectedServiceCode === option.serviceCode}
                    onPress={() => setSelectedServiceCode(option.serviceCode)}
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
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: colors.border,
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
              backgroundColor: "#000000",
              borderRadius: 99,
              alignItems: "center",
              justifyContent: "center",
              opacity: submitting || ratesLoading || selectedServiceCode === null ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                继续前往付款
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
function Header({ onBack }: Readonly<{ onBack: () => void }>): React.ReactElement {
  return (
    <View
      style={{
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: "#FFFFFF",
        position: "relative",
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        hitSlop={8}
        style={{ position: "absolute", left: 16, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text }}>
        收货信息
      </Text>
    </View>
  );
}
