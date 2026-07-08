import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePaymentSheet } from "@stripe/stripe-react-native";

import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { getCheckoutApiErrorTranslationKey } from "@/i18n/errorMap";
import { postCreatePaymentIntent } from "@/lib/checkoutApi";
import { formatRm } from "@/lib/formatCurrency";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

/**
 * Identifier for a supported (or planned) payment gateway / method.
 *
 * Only `card` (Stripe PaymentSheet) is live today. The remaining identifiers
 * are placeholders for gateways we intend to add (Malaysian e-wallets, iPay88
 * FPX online banking, etc.) so the selection UI and pay handler already have a
 * stable shape to extend.
 */
type PaymentMethodId = "card" | "ewallet" | "ipay88";

/**
 * Describes a single selectable payment method row (titles via i18n).
 */
interface PaymentMethodOption {
  /** Stable identifier branched on in the pay handler. */
  id: PaymentMethodId;
  /** i18n key for primary label. */
  titleKey: string;
  /** i18n key for supporting line. */
  subtitleKey: string;
  /** Leading icon. */
  icon: keyof typeof Ionicons.glyphMap;
  /** When false the row is shown but disabled ("coming soon"). */
  available: boolean;
}

/**
 * Ordered list of payment methods rendered on the gateway-choice screen.
 * Flip `available` to true (and add a branch in `onConfirmPay`) when a new
 * gateway is integrated.
 */
const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    id: "card",
    titleKey: "checkout.methodCard",
    subtitleKey: "checkout.methodCardSubtitle",
    icon: "card-outline",
    available: true,
  },
  {
    id: "ewallet",
    titleKey: "checkout.methodEwallet",
    subtitleKey: "checkout.methodEwalletSubtitle",
    icon: "wallet-outline",
    available: false,
  },
  {
    id: "ipay88",
    titleKey: "checkout.methodFpx",
    subtitleKey: "checkout.methodFpxSubtitle",
    icon: "business-outline",
    available: false,
  },
];

/**
 * Sticky checkout header with a back arrow and centered Playfair title.
 */
function Header({
  onBack,
  title,
}: Readonly<{ onBack: () => void; title: string }>): React.ReactElement {
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
        {title}
      </Text>
    </View>
  );
}

/**
 * A single selectable payment-method row with a radio indicator.
 */
function MethodRow({
  option,
  selected,
  onPress,
  title,
  subtitle,
  comingSoonLabel,
}: Readonly<{
  option: PaymentMethodOption;
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle: string;
  comingSoonLabel: string;
}>): React.ReactElement {
  const disabled = !option.available;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
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
        opacity: disabled ? 0.55 : 1,
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
        <Ionicons name={option.icon} size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular", marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      {disabled ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 99,
            backgroundColor: colors.panel,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "Inter_400Regular" }}>{comingSoonLabel}</Text>
        </View>
      ) : (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: selected ? 7 : 2,
            borderColor: selected ? colors.text : colors.border,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

/**
 * Payment gateway selection + Stripe PaymentSheet for a pending order created
 * on the shipping step. Currently only the Stripe `card` method is live; other
 * gateways are presented as "coming soon" placeholders.
 */
export default function CheckoutPaymentScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuthContext();
  const { clearLocalCart } = useAddToCartContext();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const { orderId: orderIdParam } = useLocalSearchParams<{ orderId?: string }>();

  const orderId = typeof orderIdParam === "string" ? orderIdParam.trim() : "";

  const [preparing, setPreparing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetReady, setSheetReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("card");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

  /** Load the order total so the screen can show what the customer will pay. */
  useEffect(() => {
    if (user === null || orderId.length === 0) {
      return;
    }
    let cancelled = false;
    void (async (): Promise<void> => {
      const { data } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || data === null) {
        return;
      }
      if (typeof data.total_amount === "number" && Number.isFinite(data.total_amount)) {
        setOrderTotal(data.total_amount);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, user]);

  const bootstrapSheet = useCallback(async (): Promise<void> => {
    setError(null);
    if (user === null || orderId.length === 0) {
      setPreparing(false);
      setSheetReady(false);
      return;
    }
    setPreparing(true);
    try {
      const clientSecret = await postCreatePaymentIntent({
        userId: user.id,
        orderId,
      });
      const returnURL = Linking.createURL("/checkout");
      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Model Match",
        returnURL,
        allowsDelayedPaymentMethods: true,
      });
      if (init.error !== undefined) {
        setError(init.error.message);
        setSheetReady(false);
        return;
      }
      setSheetReady(true);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Could not create payment intent";
      setError(t(getCheckoutApiErrorTranslationKey(raw)));
      setSheetReady(false);
    } finally {
      setPreparing(false);
    }
  }, [initPaymentSheet, orderId, t, user]);

  useEffect(() => {
    void bootstrapSheet();
  }, [bootstrapSheet]);

  const onConfirmPay = useCallback(async (): Promise<void> => {
    setError(null);
    // Only the Stripe card method is live today; other gateways are gated in UI.
    if (selectedMethod !== "card") {
      setError(t("checkout.methodUnavailable"));
      return;
    }
    if (!sheetReady) {
      return;
    }
    setPaying(true);
    try {
      const result = await presentPaymentSheet();
      if (result.error !== undefined) {
        setError(result.error.message);
        return;
      }
      // Payment confirmed by Stripe. The webhook empties add_to_carts
      // server-side; mirror that locally now so the cart never shows stale
      // items (Realtime DELETE events are unreliable for RLS tables).
      clearLocalCart();
      router.replace({
        pathname: "/checkout/success",
        params: { orderId },
      });
    } finally {
      setPaying(false);
    }
  }, [clearLocalCart, orderId, presentPaymentSheet, router, selectedMethod, sheetReady, t]);

  const headerTitle = t("checkout.selectPaymentMethod");

  const payLabel = useMemo(() => {
    if (orderTotal !== null) {
      return t("checkout.confirmPayWithAmount", { amount: formatRm(orderTotal) });
    }
    return t("checkout.confirmPay");
  }, [orderTotal, t]);

  if (authLoading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header onBack={() => router.back()} title={headerTitle} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header onBack={() => router.back()} title={headerTitle} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: colors.muted, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 }}>
            {t("checkout.loginRequiredShort")}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/sign-in")}
            style={{ height: 52, paddingHorizontal: 32, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{t("checkout.goSignIn")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (orderId.length === 0) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header onBack={() => router.back()} title={headerTitle} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: colors.danger, fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", marginBottom: 16 }}>
            {t("checkout.missingOrderId")}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ height: 52, paddingHorizontal: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 99, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontFamily: "Inter_400Regular" }}>{t("checkout.back")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const orderRef = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const payDisabled = paying || preparing || selectedMethod !== "card" || !sheetReady;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header onBack={() => router.back()} title={headerTitle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary card */}
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("checkout.orderNumber")}</Text>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              #{orderRef}
            </Text>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 12,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("checkout.amountDue")}</Text>
            <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 24, color: colors.text }}>
              {orderTotal !== null ? formatRm(orderTotal) : t("orderSuccess.notAvailable")}
            </Text>
          </View>
        </View>

        {/* Payment methods */}
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 16,
            color: colors.text,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          {t("checkout.paymentMethods")}
        </Text>
        <View style={{ gap: 10 }}>
          {PAYMENT_METHODS.map((option) => (
            <MethodRow
              key={option.id}
              option={option}
              selected={option.available && selectedMethod === option.id}
              onPress={() => setSelectedMethod(option.id)}
              title={t(option.titleKey)}
              subtitle={t(option.subtitleKey)}
              comingSoonLabel={t("checkout.comingSoon")}
            />
          ))}
        </View>

        {/* Security note */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingHorizontal: 4 }}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
          <Text style={{ flex: 1, fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular", lineHeight: 18 }}>
            {t("checkout.securityNote")}
          </Text>
        </View>

        {error !== null ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#F2C9C6",
              backgroundColor: "#FCEDEC",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.danger, fontFamily: "Inter_400Regular" }}>{error}</Text>
              <TouchableOpacity onPress={() => void bootstrapSheet()} style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 13, color: colors.text, textDecorationLine: "underline", fontFamily: "Inter_400Regular" }}>
                  {t("checkout.retry")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
          onPress={() => void onConfirmPay()}
          disabled={payDisabled}
          activeOpacity={0.85}
          style={{
            height: 56,
            backgroundColor: "#000000",
            borderRadius: 99,
            alignItems: "center",
            justifyContent: "center",
            opacity: payDisabled ? 0.5 : 1,
          }}
        >
          {paying || preparing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              {payLabel}
            </Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}
