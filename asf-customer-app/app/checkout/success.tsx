import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import type { Database } from "@/database.types";
import { formatRm } from "@/lib/formatCurrency";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const FALLBACK_TIMEOUT_MS = 10_000;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function shortOrderRef(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/**
 * Primary (filled black) action button.
 */
function PrimaryButton({
  label,
  onPress,
}: Readonly<{ label: string; onPress: () => void }>): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ height: 56, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Secondary (outlined) action button.
 */
function SecondaryButton({
  label,
  onPress,
}: Readonly<{ label: string; onPress: () => void }>): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 99, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Centered status layout used by every terminal state on this screen.
 */
function StatusLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>{children}</View>
    </SafeAreaView>
  );
}

/**
 * Order confirmation: waits for webhook to mark order `processing` via Realtime (+ timeout fallback).
 */
export default function CheckoutSuccessScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { orderId: orderIdParam } = useLocalSearchParams<{ orderId?: string }>();
  const { user, loading: authLoading } = useAuthContext();
  const { clearLocalCart } = useAddToCartContext();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const cartClearedRef = useRef(false);

  const orderId = typeof orderIdParam === "string" ? orderIdParam.trim() : "";
  const orderIdValid = useMemo(() => orderId.length > 0 && isUuid(orderId), [orderId]);

  /**
   * Once the webhook confirms the order (status `processing`), the server has
   * already emptied `add_to_carts`. Mirror that in the local cart state so the
   * cart badge/list update immediately. Guarded so it only runs once.
   */
  useEffect(() => {
    if (order !== null && !cartClearedRef.current) {
      cartClearedRef.current = true;
      clearLocalCart();
    }
  }, [order, clearLocalCart]);

  useEffect(() => {
    if (authLoading || user === null) {
      return;
    }
    if (!orderIdValid) {
      return;
    }

    const userId = user.id;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        setTimedOut(true);
      }
    }, FALLBACK_TIMEOUT_MS);

    async function loadOrder(): Promise<void> {
      const { data, error: qErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) {
        return;
      }
      if (qErr !== null) {
        setLoadError(qErr.message);
        return;
      }
      if (data === null) {
        setLoadError(t("orderSuccess.orderNotFound"));
        return;
      }
      if (data.status === "processing") {
        setOrder(data);
      }
    }

    void loadOrder();

    const channel = supabase
      .channel(`order-success:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          void (async (): Promise<void> => {
            const { data } = await supabase
              .from("orders")
              .select("*")
              .eq("id", orderId)
              .eq("user_id", userId)
              .maybeSingle();
            if (data !== null && data.status === "processing") {
              setOrder(data);
            }
          })();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [authLoading, orderId, orderIdValid, t, user]);

  if (authLoading) {
    return (
      <StatusLayout>
        <View style={{ alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </StatusLayout>
    );
  }

  if (user === null) {
    return (
      <StatusLayout>
        <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 24, fontSize: 14, fontFamily: "Inter_400Regular" }}>
          {t("orderSuccess.loginRequired")}
        </Text>
        <PrimaryButton label={t("orderSuccess.goSignIn")} onPress={() => router.replace("/(auth)/sign-in")} />
      </StatusLayout>
    );
  }

  if (!orderIdValid) {
    return (
      <StatusLayout>
        <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 24, fontSize: 14, fontFamily: "Inter_400Regular" }}>
          {t("orderSuccess.missingOrderParam")}
        </Text>
        <SecondaryButton label={t("orderSuccess.backHome")} onPress={() => router.replace("/(tabs)")} />
      </StatusLayout>
    );
  }

  if (loadError !== null) {
    return (
      <StatusLayout>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#FCEDEC",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
          </View>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 6 }}>
            {t("orderSuccess.somethingWrong")}
          </Text>
          <Text style={{ color: colors.muted, textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 }}>
            {loadError}
          </Text>
        </View>
        <SecondaryButton label={t("orderSuccess.backHome")} onPress={() => router.replace("/(tabs)")} />
      </StatusLayout>
    );
  }

  if (order !== null) {
    const ref = shortOrderRef(order.id);
    const total =
      typeof order.total_amount === "number" && Number.isFinite(order.total_amount)
        ? order.total_amount
        : 0;
    return (
      <StatusLayout>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="checkmark-circle" size={44} color={colors.success} />
          </View>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 24, color: colors.text, marginBottom: 8 }}>
            {t("orderSuccess.title")}
          </Text>
          <Text style={{ color: colors.muted, textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 }}>
            {t("orderSuccess.confirmedWithHash", { ref })}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginBottom: 28,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("orderSuccess.amountPaid")}</Text>
          <Text style={{ fontSize: 18, color: colors.text, fontWeight: "700", fontFamily: "Inter_400Regular" }}>
            {formatRm(total)}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <PrimaryButton label={t("orderSuccess.viewOrder")} onPress={() => router.replace(`/(tabs)/profile/orders/${order.id}`)} />
          <SecondaryButton label={t("orderSuccess.continueShopping")} onPress={() => router.replace("/(tabs)")} />
        </View>
      </StatusLayout>
    );
  }

  if (timedOut) {
    return (
      <StatusLayout>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.panel,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="time-outline" size={40} color={colors.accent} />
          </View>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 22, color: colors.text, marginBottom: 8 }}>
            {t("orderSuccess.paymentReceived")}
          </Text>
          <Text style={{ color: colors.muted, textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 }}>
            {t("orderSuccess.confirmingSlow")}
          </Text>
        </View>
        <View style={{ gap: 12 }}>
          <PrimaryButton label={t("orderSuccess.viewOrder")} onPress={() => router.replace(`/(tabs)/profile/orders/${orderId}`)} />
          <SecondaryButton label={t("orderSuccess.backHome")} onPress={() => router.replace("/(tabs)")} />
        </View>
      </StatusLayout>
    );
  }

  return (
    <StatusLayout>
      <View style={{ alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={{ color: colors.muted, marginTop: 16, fontSize: 14, fontFamily: "Inter_400Regular" }}>
          {t("orderSuccess.confirmingOrder")}
        </Text>
      </View>
    </StatusLayout>
  );
}
