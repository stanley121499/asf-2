import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubPageHeader } from "@/components/SubPageHeader";
import { OrderProgressDots } from "@/components/OrderProgressTracker";
import { PressableScale } from "@/components/motion";
import { useAuthContext } from "@/context/AuthContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { useOrderContext } from "@/context/product/OrderContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";
import type { Database } from "@/database.types";
import { formatDate } from "@/i18n/format";
import { formatRm } from "@/lib/formatCurrency";
import { supabase } from "@/lib/supabase";
import type { ThemeTokens } from "@/themes/types";

/** Per-order preview built from its line items: thumbnails + a names summary. */
interface OrderPreview {
  /** Primary product image URLs (deduped, lowest arrangement first). */
  images: string[];
  /** Display names of products in the order. */
  names: string[];
  /** Total number of line items. */
  count: number;
}

/** Visual treatment for an order status chip (label comes from i18n). */
interface StatusMeta {
  labelKey: string;
  bg: string;
  fg: string;
}

/**
 * Maps a raw order status to an `orders.status.*` key and on-brand chip colours.
 * Pure helper — pass tokens from the calling component.
 */
function statusMeta(status: string | null | undefined, tokens: ThemeTokens): StatusMeta {
  const s = (status ?? "").trim().toLowerCase();
  if (s.includes("cancel")) {
    return { labelKey: "orders.status.cancelled", bg: "rgba(232,69,60,0.12)", fg: tokens.danger };
  }
  if (s.includes("deliver") || s.includes("complete")) {
    return { labelKey: "orders.status.delivered", bg: "rgba(34,197,94,0.12)", fg: tokens.success };
  }
  if (s.includes("ship") || s.includes("transit")) {
    return { labelKey: "orders.status.shipped", bg: "rgba(201,169,110,0.16)", fg: tokens.accent };
  }
  if (s.includes("pickup")) {
    return { labelKey: "orders.status.awaitingPickup", bg: "rgba(201,169,110,0.16)", fg: tokens.accent };
  }
  if (s.includes("process") || s.includes("paid")) {
    return { labelKey: "orders.status.processing", bg: "rgba(201,169,110,0.16)", fg: tokens.accent };
  }
  return { labelKey: "orders.status.pending", bg: tokens.panel, fg: tokens.muted };
}

type OrderMediaRow = {
  order_id: string | null;
  products: {
    name: string | null;
    product_medias: { media_url: string | null; arrangement: number | null }[] | null;
  } | null;
};

/**
 * Narrows a Supabase join row into {@link OrderMediaRow} without unsafe casts.
 */
function isOrderMediaRow(value: unknown): value is OrderMediaRow {
  if (value === null || typeof value !== "object") {
    return false;
  }
  return "order_id" in value && "products" in value;
}

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

/**
 * Shared props for Classic card, Atelier text-index, and Noir dense order rows.
 */
interface OrderRowProps {
  order: OrderRow;
  preview: OrderPreview | undefined;
  onPress: () => void;
}

/**
 * Builds the human-readable product summary line for an order preview.
 */
function orderSummary(
  preview: OrderPreview | undefined,
  t: (key: string, params?: { count?: number; name?: string }) => string
): string {
  const names = preview?.names ?? [];
  const count = preview?.count ?? 0;
  if (names.length === 0) {
    return count > 0 ? t("orders.itemCount", { count }) : t("orders.awaitingConfirm");
  }
  if (names.length === 1) {
    const only = names[0];
    return typeof only === "string" ? only : t("orders.productFallback");
  }
  const first = names[0];
  return t("orders.summaryAndMore", {
    name: typeof first === "string" ? first : "",
    count,
  });
}

/**
 * Order history list — Classic keeps editorial cards; Atelier uses a paper
 * text-index; Noir uses dense night-settings rows (hairlines, Inter).
 */
export default function OrdersListScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isAtelier = themeId === "atelier";
  const isNoir = themeId === "noir";
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { orders, loading, refreshOrders } = useOrderContext();

  /** Page ground: paper/bg under Atelier+Noir; warm panel under Classic. */
  const pageBg = isAtelier || isNoir ? tokens.bg : tokens.panel;

  const mine = useMemo(() => {
    if (user === null) return [];
    return [...orders.filter((o) => o.user_id === user.id)].sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );
  }, [orders, user]);

  const [previews, setPreviews] = useState<Record<string, OrderPreview>>({});

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

  // Fetch line-item previews (thumbnails + names) for the visible orders.
  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      const ids = mine.map((o) => o.id);
      if (ids.length === 0) {
        setPreviews({});
        return;
      }

      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, products(name, product_medias(media_url, arrangement))")
        .in("order_id", ids);

      if (cancelled || error !== null || data === null) {
        return;
      }

      const map: Record<string, OrderPreview> = {};
      for (const row of data) {
        if (!isOrderMediaRow(row)) {
          continue;
        }
        const orderId = row.order_id;
        if (typeof orderId !== "string") {
          continue;
        }
        const entry = map[orderId] ?? { images: [], names: [], count: 0 };
        entry.count += 1;

        const name = row.products?.name;
        if (typeof name === "string" && name.trim().length > 0) {
          entry.names.push(name.trim());
        }

        const medias = row.products?.product_medias ?? [];
        const sorted = [...medias].sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0));
        for (const media of sorted) {
          if (typeof media.media_url === "string" && media.media_url.trim().length > 0) {
            entry.images.push(media.media_url.trim());
            break;
          }
        }

        map[orderId] = entry;
      }

      setPreviews(map);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [mine]);

  if (user === null) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: pageBg }}>
        <SubPageHeader title={t("orders.myOrders")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("orders.signInToView")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: pageBg }}>
        <SubPageHeader title={t("orders.myOrders")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <SubPageHeader title={t("orders.myOrders")} />

      {mine.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          {isAtelier || isNoir ? null : (
            <Ionicons name="bag-outline" size={48} color={tokens.border} style={{ marginBottom: 16 }} />
          )}
          <Text
            style={{
              fontFamily: isNoir ? "Inter_400Regular" : "PlayfairDisplay_400Regular",
              fontSize: isAtelier ? 28 : isNoir ? 16 : 20,
              fontWeight: isNoir ? "600" : "400",
              letterSpacing: isNoir ? 0.5 : 0,
              lineHeight: isAtelier ? 36 : undefined,
              color: tokens.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {t("orders.emptyTitle")}
          </Text>
          <Text
            style={{
              fontSize: isNoir ? 13 : 14,
              color: tokens.muted,
              marginBottom: 24,
              textAlign: "center",
              fontFamily: "Inter_400Regular",
              maxWidth: 280,
            }}
          >
            {t("orders.emptyBody")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/browse")}
            style={
              isAtelier
                ? {
                    height: 48,
                    paddingHorizontal: 32,
                    borderWidth: 1,
                    borderColor: tokens.text,
                    borderRadius: 2,
                    alignItems: "center",
                    justifyContent: "center",
                  }
                : isNoir
                  ? {
                      height: 44,
                      paddingHorizontal: 28,
                      backgroundColor: tokens.accent,
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }
                  : {
                      height: 52,
                      paddingHorizontal: 32,
                      backgroundColor: tokens.text,
                      borderRadius: 99,
                      alignItems: "center",
                      justifyContent: "center",
                    }
            }
          >
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
                        fontSize: 15,
                        fontFamily: "Inter_400Regular",
                      }
              }
            >
              {t("orders.shopCta")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mine}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{
            paddingHorizontal: isAtelier ? 24 : isNoir ? 0 : 16,
            paddingTop: isAtelier ? 8 : isNoir ? 0 : 16,
            paddingBottom: 48,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            isAtelier ? (
              <View style={{ paddingTop: 24, paddingBottom: 16 }}>
                <Text
                  style={{
                    fontFamily: "PlayfairDisplay_400Regular",
                    fontSize: 28,
                    lineHeight: 36,
                    color: tokens.text,
                    marginBottom: 6,
                  }}
                >
                  {t("orders.myOrders")}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: tokens.muted,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {t("orders.viewHistory")}
                </Text>
              </View>
            ) : isNoir ? (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 8,
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
                  }}
                >
                  {t("orders.viewHistory")}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item: o }) =>
            isAtelier ? (
              <AtelierOrderRow
                order={o}
                preview={previews[o.id]}
                onPress={() => router.push(`/(tabs)/profile/orders/${o.id}`)}
              />
            ) : isNoir ? (
              <NoirOrderRow
                order={o}
                preview={previews[o.id]}
                onPress={() => router.push(`/(tabs)/profile/orders/${o.id}`)}
              />
            ) : (
              <OrderCard
                order={o}
                preview={previews[o.id]}
                onPress={() => router.push(`/(tabs)/profile/orders/${o.id}`)}
              />
            )
          }
        />
      )}
    </View>
  );
}

/**
 * Atelier text-index row — hairline divider, ref + status + total, no card chrome.
 * Matches ProfileHub MenuRow / Home category index language.
 */
function AtelierOrderRow({
  order,
  preview,
  onPress,
}: Readonly<OrderRowProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const date =
    typeof order.created_at === "string" && order.created_at.length > 0
      ? formatDate(locale, order.created_at)
      : "—";
  const total = typeof order.total_amount === "number" ? order.total_amount : null;
  const status = typeof order.status === "string" ? order.status : null;
  const meta = statusMeta(status, tokens);
  const summary = orderSummary(preview, t);
  const thumb = preview?.images[0];

  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={`#${shortId}`}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        paddingVertical: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        {typeof thumb === "string" && thumb.length > 0 ? (
          <View
            style={{
              width: 56,
              height: 72,
              overflow: "hidden",
              backgroundColor: tokens.panel,
            }}
          >
            <Image source={{ uri: thumb }} style={{ width: 56, height: 72 }} contentFit="cover" />
          </View>
        ) : (
          <View
            style={{
              width: 56,
              height: 72,
              backgroundColor: tokens.panel,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="bag-handle-outline" size={20} color={tokens.muted} />
          </View>
        )}

        <View style={{ flex: 1, gap: 4 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: tokens.text,
                fontFamily: "Inter_400Regular",
              }}
            >
              #{shortId}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: meta.fg,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t(meta.labelKey)}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
          >
            {date}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: tokens.text,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {summary}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 18,
                color: tokens.text,
              }}
            >
              {formatRm(total)}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={tokens.muted} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

/**
 * Noir dense order row — night-settings hairline list (no Classic card chrome).
 * Price-forward Inter; compact thumb; status as plain text.
 */
function NoirOrderRow({
  order,
  preview,
  onPress,
}: Readonly<OrderRowProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const date =
    typeof order.created_at === "string" && order.created_at.length > 0
      ? formatDate(locale, order.created_at)
      : "—";
  const total = typeof order.total_amount === "number" ? order.total_amount : null;
  const status = typeof order.status === "string" ? order.status : null;
  const meta = statusMeta(status, tokens);
  const summary = orderSummary(preview, t);
  const thumb = preview?.images[0];

  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={`#${shortId}`}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {typeof thumb === "string" && thumb.length > 0 ? (
          <View
            style={{
              width: 48,
              height: 48,
              overflow: "hidden",
              backgroundColor: tokens.panel,
              borderRadius: 2,
            }}
          >
            <Image source={{ uri: thumb }} style={{ width: 48, height: 48 }} contentFit="cover" />
          </View>
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: tokens.panel,
              borderRadius: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="bag-handle-outline" size={18} color={tokens.muted} />
          </View>
        )}

        <View style={{ flex: 1, gap: 2 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tokens.text,
                fontFamily: "Inter_400Regular",
              }}
            >
              #{shortId}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: meta.fg,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t(meta.labelKey)}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 11,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
          >
            {date}
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: tokens.text,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {summary}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              fontWeight: "600",
              color: tokens.text,
            }}
          >
            {formatRm(total)}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={tokens.muted} />
        </View>
      </View>
    </PressableScale>
  );
}

/**
 * A single editorial order card: ref + date, status chip, product thumbnails
 * with a names summary, progress dots, and a Playfair total.
 * Classic only.
 */
function OrderCard({
  order,
  preview,
  onPress,
}: Readonly<OrderRowProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const date =
    typeof order.created_at === "string" && order.created_at.length > 0
      ? formatDate(locale, order.created_at)
      : "—";
  const total = typeof order.total_amount === "number" ? order.total_amount : null;
  const status = typeof order.status === "string" ? order.status : null;
  const meta = statusMeta(status, tokens);
  const summary = orderSummary(preview, t);

  const images = preview?.images ?? [];
  const count = preview?.count ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        marginBottom: 14,
        backgroundColor: tokens.bg,
        borderRadius: 20,
        padding: 18,
        shadowColor: "#000000",
        shadowOpacity: 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 5 },
        elevation: 2,
      }}
    >
      {/* Header: ref + date | status chip */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 14, height: 2, backgroundColor: tokens.accent }} />
          <Text style={{ fontSize: 13, letterSpacing: 1, color: tokens.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
            #{shortId}
          </Text>
        </View>
        <View style={{ backgroundColor: meta.bg, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ fontSize: 12, color: meta.fg, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
            {t(meta.labelKey)}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 4, marginLeft: 22, fontFamily: "Inter_400Regular" }}>
        {date}
      </Text>

      {/* Product preview: thumbnails + summary */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 }}>
        {images.length > 0 ? (
          <View style={{ flexDirection: "row" }}>
            {images.slice(0, 3).map((uri, idx) => (
              <View
                key={`${uri}-${idx}`}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: tokens.panel,
                  borderWidth: 2,
                  borderColor: tokens.bg,
                  marginLeft: idx === 0 ? 0 : -12,
                }}
              >
                <Image source={{ uri }} style={{ width: 52, height: 52 }} contentFit="cover" />
              </View>
            ))}
            {count > 3 ? (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: tokens.panel,
                  borderWidth: 2,
                  borderColor: tokens.bg,
                  marginLeft: -12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: tokens.muted, fontWeight: "600", fontFamily: "Inter_400Regular" }}>+{count - 3}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: tokens.panel, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="bag-handle-outline" size={22} color={tokens.muted} />
          </View>
        )}

        <Text style={{ flex: 1, fontSize: 13, color: tokens.text, fontFamily: "Inter_400Regular" }} numberOfLines={2}>
          {summary}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: tokens.border, marginTop: 16, marginBottom: 14 }} />

      {/* Footer: progress dots | total */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <OrderProgressDots status={status} />
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, letterSpacing: 1, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("orders.total")}
          </Text>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: tokens.text, marginTop: 2 }}>
            {formatRm(total)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
