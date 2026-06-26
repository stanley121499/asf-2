import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useProductContext } from "@/context/product/ProductContext";
import { formatRm } from "@/lib/formatCurrency";
import { colors as theme } from "@/constants/theme";
import {
  getProductStockQuantity,
  resolveProductStockRow,
} from "@/lib/productStock";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Accordion item ───────────────────────────────────────────────────────────

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}

function Accordion({ title, children, open, onToggle }: AccordionProps): React.ReactElement {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <TouchableOpacity
        onPress={onToggle}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 20,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 15, color: theme.text, fontFamily: "Inter_400Regular" }}>{title}</Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.muted}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </TouchableOpacity>
      {open && (
        <View style={{ paddingBottom: 16 }}>
          {children}
        </View>
      )}
    </View>
  );
}

// ─── Product detail screen ────────────────────────────────────────────────────

/**
 * Product detail — matches web ProductDetailsClient exactly:
 *   - 1:1 image with tap-to-navigate and X/Y pill
 *   - Floating back + wishlist heart
 *   - Name, price, stock status
 *   - Color pills (rounded-full) + size squares (no radius)
 *   - Accordion: 商品详情, 材质与保养, 配送与退货
 *   - Fixed bottom "加入购物袋" CTA
 */
export default function ProductDetailScreen(): React.ReactElement {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { products, loading } = useProductContext();
  const { user } = useAuthContext();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const { createAddToCart, add_to_carts, updateAddToCart } = useAddToCartContext();

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const sortedMedias = useMemo(
    () => [...(product?.medias ?? [])].sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)),
    [product]
  );

  const activeColors = useMemo(
    () => (product?.product_colors ?? []).filter((c) => c.active),
    [product]
  );
  const activeSizes = useMemo(
    () => (product?.product_sizes ?? []).filter((s) => s.active),
    [product]
  );

  const requiresColor = activeColors.length > 0;
  const requiresSize = activeSizes.length > 0;

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string>("description");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  /** Auto-select when only one option */
  useEffect(() => {
    if (requiresColor && activeColors.length === 1 && selectedColorId === null) {
      setSelectedColorId(activeColors[0].id);
    }
    if (requiresSize && activeSizes.length === 1 && selectedSizeId === null) {
      setSelectedSizeId(activeSizes[0].id);
    }
  }, [activeColors, activeSizes, requiresColor, requiresSize, selectedColorId, selectedSizeId]);

  const isSaved = product !== null && product !== undefined ? isInWishlist(product.id) : false;

  const hasAllSelections = (!requiresColor || selectedColorId !== null) && (!requiresSize || selectedSizeId !== null);

  const currentStockRow = useMemo(() => {
    if (product === undefined) {
      return null;
    }
    return resolveProductStockRow({
      productId: product.id,
      productStocks: product.product_stocks,
      requiresColor,
      requiresSize,
      selectedColorId,
      selectedSizeId,
    });
  }, [product, requiresColor, requiresSize, selectedColorId, selectedSizeId]);

  const stockCount = getProductStockQuantity(currentStockRow);
  const isInStock = hasAllSelections && currentStockRow !== null && stockCount > 0;

  const navigateImage = (dir: "prev" | "next") => {
    if (sortedMedias.length <= 1) return;
    setSelectedImageIdx((prev) => {
      if (dir === "next") return prev < sortedMedias.length - 1 ? prev + 1 : 0;
      return prev > 0 ? prev - 1 : sortedMedias.length - 1;
    });
  };

  const handleToggleWishlist = useCallback(async (): Promise<void> => {
    if (product === undefined) return;
    if (user === null) {
      router.push("/(auth)/sign-in");
      return;
    }
    if (isSaved) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  }, [addToWishlist, isSaved, product, removeFromWishlist, router, user]);

  const onAddToCart = useCallback(async (): Promise<void> => {
    setAddError(null);
    if (product === undefined) return;
    if (user === null) {
      router.push("/(auth)/sign-in");
      return;
    }
    if (requiresColor && selectedColorId === null) {
      setAddError("请选择颜色。");
      return;
    }
    if (requiresSize && selectedSizeId === null) {
      setAddError("请选择尺码。");
      return;
    }
    if (currentStockRow === null) {
      setAddError("所选规格暂无库存。");
      return;
    }
    if (stockCount < 1) {
      setAddError("此商品库存不足。");
      return;
    }
    setAdding(true);
    try {
      const existing = add_to_carts.find(
        (row) =>
          row.user_id === user.id &&
          row.product_id === product.id &&
          row.color_id === selectedColorId &&
          row.size_id === selectedSizeId
      );
      if (existing !== undefined) {
        await updateAddToCart({ id: existing.id, amount: existing.amount + 1 });
      } else {
        await createAddToCart({
          user_id: user.id,
          product_id: product.id,
          color_id: selectedColorId,
          size_id: selectedSizeId,
          amount: 1,
        });
      }
      router.push("/cart");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "无法加入购物袋");
    } finally {
      setAdding(false);
    }
  }, [add_to_carts, createAddToCart, currentStockRow, product, requiresColor, requiresSize, router, selectedColorId, selectedSizeId, stockCount, updateAddToCart, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (product === undefined) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: theme.text, marginBottom: 16 }}>未找到商品</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ height: 52, paddingHorizontal: 32, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_400Regular" }}>继续购物</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentMedia = sortedMedias[selectedImageIdx] ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* ── Hero image — 1:1 ratio, tap zones to navigate ── */}
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: "#F5F5F3" }}>
          {currentMedia !== null && currentMedia.media_url !== null && currentMedia.media_url.length > 0 ? (
            <Image
              source={{ uri: currentMedia.media_url }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              contentFit="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={48} color={theme.muted} />
            </View>
          )}

          {/* Tap zones: left = prev, right = next */}
          {sortedMedias.length > 1 && (
            <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
              <Pressable style={{ flex: 1 }} onPress={() => navigateImage("prev")} />
              <Pressable style={{ flex: 1 }} onPress={() => navigateImage("next")} />
            </View>
          )}

          {/* Image counter pill */}
          {sortedMedias.length > 1 && (
            <View
              style={{
                position: "absolute",
                bottom: 16,
                alignSelf: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
                borderRadius: 99,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
              pointerEvents="none"
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 1 }}>
                {selectedImageIdx + 1} / {sortedMedias.length}
              </Text>
            </View>
          )}

          {/* Floating back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.7)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* ── Product info ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          {/* Name + wishlist */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <Text
              style={{
                flex: 1,
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 22,
                color: theme.text,
                lineHeight: 30,
              }}
            >
              {product.name ?? "Product"}
            </Text>
            <TouchableOpacity
              onPress={() => void handleToggleWishlist()}
              hitSlop={8}
              style={{ paddingTop: 4 }}
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={24}
                color={isSaved ? "#EF4444" : theme.text}
              />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <Text style={{ fontSize: 17, color: theme.accent, fontWeight: "500", fontFamily: "Inter_400Regular", marginTop: 8 }}>
            {formatRm(typeof product.price === "number" ? product.price : 0)}
          </Text>

          {/* Stock status */}
          <View style={{ marginTop: 12 }}>
            {!hasAllSelections && (requiresColor || requiresSize) ? (
              <Text style={{ fontSize: 13, color: theme.muted, fontFamily: "Inter_400Regular" }}>
                {`请选择${[requiresColor && selectedColorId === null ? "颜色" : "", requiresSize && selectedSizeId === null ? "尺码" : ""].filter(Boolean).join("和")}`}
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: isInStock ? "#16A34A" : "#EF4444",
                  fontFamily: "Inter_400Regular",
                }}
              >
                {isInStock ? `有货（剩余 ${stockCount} 件）` : "缺货"}
              </Text>
            )}
          </View>

          {/* ── Color picker ── */}
          {requiresColor && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 13, color: theme.text, fontWeight: "500", fontFamily: "Inter_400Regular", marginBottom: 12 }}>
                颜色
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {activeColors.map((c) => {
                  const selected = selectedColorId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedColorId(c.id)}
                      style={{
                        height: 40,
                        paddingHorizontal: 16,
                        borderRadius: 99,
                        borderWidth: 2,
                        borderColor: selected ? "#000000" : theme.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: selected ? "#000000" : theme.muted,
                          fontWeight: selected ? "500" : "400",
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        {c.color ?? c.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Size picker ── */}
          {requiresSize && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 13, color: theme.text, fontWeight: "500", fontFamily: "Inter_400Regular", marginBottom: 12 }}>
                尺码
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {activeSizes.map((s) => {
                  const selected = selectedSizeId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedSizeId(s.id)}
                      style={{
                        height: 48,
                        paddingHorizontal: 24,
                        borderWidth: 1,
                        borderColor: selected ? "#000000" : theme.border,
                        backgroundColor: selected ? "#000000" : "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: selected ? "#FFFFFF" : theme.text,
                          fontWeight: selected ? "500" : "400",
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        {s.size ?? s.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Accordions ── */}
          <View style={{ marginTop: 32, borderTopWidth: 1, borderTopColor: theme.border }}>
            <Accordion
              title="商品详情"
              open={openAccordion === "description"}
              onToggle={() => setOpenAccordion(openAccordion === "description" ? "" : "description")}
            >
              <Text style={{ fontSize: 13, color: theme.muted, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
                {product.description !== null && product.description !== "" ? product.description : "暂无详情介绍。"}
              </Text>
            </Accordion>

            <Accordion
              title="材质与保养"
              open={openAccordion === "material"}
              onToggle={() => setOpenAccordion(openAccordion === "material" ? "" : "material")}
            >
              <Text style={{ fontSize: 13, color: theme.muted, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
                请手洗或机洗冷水，不可漂白。自然晾干即可。
              </Text>
            </Accordion>

            <Accordion
              title="配送与退货"
              open={openAccordion === "shipping"}
              onToggle={() => setOpenAccordion(openAccordion === "shipping" ? "" : "shipping")}
            >
              <Text style={{ fontSize: 13, color: theme.muted, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
                所有订单提供标准配送。30天内免费退换货服务。
              </Text>
            </Accordion>
          </View>

          {/* ── Reviews stub ── */}
          <View style={{ marginTop: 40 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "500", color: theme.text, fontFamily: "Inter_400Regular" }}>
                用户评价 (4.8/5)
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: "#000000",
                  borderRadius: 99,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#000000", fontFamily: "Inter_400Regular" }}>
                  撰写评价
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: theme.muted, fontFamily: "Inter_400Regular" }}>
              暂无评价，成为第一个撰写评价的用户。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed bottom CTA ── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(255,255,255,0.9)",
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        {addError !== null && (
          <Text style={{ fontSize: 13, color: theme.danger, marginBottom: 8, textAlign: "center", fontFamily: "Inter_400Regular" }}>
            {addError}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => void onAddToCart()}
          disabled={adding || (hasAllSelections && !isInStock)}
          style={{
            height: 56,
            backgroundColor: "#000000",
            borderRadius: 99,
            alignItems: "center",
            justifyContent: "center",
            opacity: adding || (hasAllSelections && !isInStock) ? 0.4 : 1,
          }}
        >
          {adding ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              加入购物袋
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
