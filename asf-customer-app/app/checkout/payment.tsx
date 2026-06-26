import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePaymentSheet } from "@stripe/stripe-react-native";

import { useAuthContext } from "@/context/AuthContext";
import { postCreatePaymentIntent } from "@/lib/checkoutApi";
import { colors } from "@/constants/theme";

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
        安全支付
      </Text>
    </View>
  );
}

/**
 * Stripe PaymentSheet for a pending order created on the shipping step.
 */
export default function CheckoutPaymentScreen(): React.ReactElement {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const { orderId: orderIdParam } = useLocalSearchParams<{ orderId?: string }>();

  const orderId = typeof orderIdParam === "string" ? orderIdParam.trim() : "";

  const [preparing, setPreparing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetReady, setSheetReady] = useState(false);

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
      const msg = e instanceof Error ? e.message : "无法启动支付";
      setError(msg);
      setSheetReady(false);
    } finally {
      setPreparing(false);
    }
  }, [initPaymentSheet, orderId, user]);

  useEffect(() => {
    void bootstrapSheet();
  }, [bootstrapSheet]);

  const onConfirmPay = useCallback(async (): Promise<void> => {
    setError(null);
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
      router.replace({
        pathname: "/checkout/success",
        params: { orderId },
      });
    } finally {
      setPaying(false);
    }
  }, [orderId, presentPaymentSheet, router, sheetReady]);

  if (authLoading || preparing) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={{ color: colors.muted, marginTop: 16, fontSize: 14, fontFamily: "Inter_400Regular" }}>
            正在准备安全支付…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: colors.muted, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 }}>
            请先登录。
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/sign-in")}
            style={{ height: 52, paddingHorizontal: 32, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600", fontFamily: "Inter_400Regular" }}>去登录</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (orderId.length === 0) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: colors.danger, fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", marginBottom: 16 }}>
            缺少订单编号，请返回结账第一步。
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ height: 52, paddingHorizontal: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 99, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontFamily: "Inter_400Regular" }}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const orderRef = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header onBack={() => router.back()} />

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>订单号</Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular", marginTop: 2 }}>
                #{orderRef}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
            <Text style={{ flex: 1, fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular", lineHeight: 18 }}>
              由 Stripe 提供安全加密支付，您的卡信息不会存储在本应用中。
            </Text>
          </View>
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
                  重试
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

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
          disabled={paying || !sheetReady}
          activeOpacity={0.85}
          style={{
            height: 56,
            backgroundColor: "#000000",
            borderRadius: 99,
            alignItems: "center",
            justifyContent: "center",
            opacity: paying || !sheetReady ? 0.5 : 1,
          }}
        >
          {paying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              确认支付
            </Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}
