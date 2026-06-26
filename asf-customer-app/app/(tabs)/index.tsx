"use client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAnnouncementContext } from "@/context/AnnouncementContext";
import { useAuthContext } from "@/context/AuthContext";
import { usePostContext } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import type { Product } from "@/context/product/ProductContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { colors } from "@/constants/theme";
import { formatRm } from "@/lib/formatCurrency";

const CATEGORY_LABELS: Record<string, string> = {
  Handbag: "手袋",
  Streetwear: "街头服饰",
  "Spring Collection": "春季新品",
  Ladies: "女装",
  Men: "男装",
  Accessories: "配饰",
  Shoes: "鞋履",
  Beauty: "美妆",
  Pants: "长裤",
  Tops: "上衣",
  Bottoms: "下装",
};

function productThumb(p: Product): string {
  const first = p.medias[0];
  return typeof first?.media_url === "string" ? first.media_url : "";
}

/**
 * Home screen matching web HomePageClient exactly:
 * 1. Transparent top navbar (handled via StatusBar + scroll)
 * 2. Full-height hero (55% screen) — post image with dark gradient, two pill CTA buttons
 * 3. "新品上市" — font-display heading + divider line, 2-col grid, sharp-edge images (no border-radius),
 *    3:4 aspect ratio, product name truncated, price in accent gold, heart icon
 * 4. "商品分类" — horizontal scroll of pill buttons with border
 * 5. Posts strip (if posts exist)
 */
export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuthContext();
  const { products, loading: productsLoading } = useProductContext();
  const { categories, loading: categoriesLoading } = useCategoryContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const { announcement } = useAnnouncementContext();

  const [scrollY, setScrollY] = useState(0);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const da = new Date(a.created_at ?? 0).getTime();
      const db = new Date(b.created_at ?? 0).getTime();
      return db - da;
    });
  }, [products]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.arrangement !== null && b.arrangement !== null) return a.arrangement - b.arrangement;
      if (a.arrangement !== null) return -1;
      if (b.arrangement !== null) return 1;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  }, [categories]);

  const postMediaMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of postMedias) {
      if (typeof m.post_id === "string" && !map.has(m.post_id)) {
        map.set(m.post_id, m.media_url ?? "");
      }
    }
    return map;
  }, [postMedias]);

  const sortedPosts = useMemo(() => {
    return [...posts]
      .filter((p) => p.id.length > 0)
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  }, [posts]);

  const firstPost = sortedPosts.length > 0 ? sortedPosts[0] : null;
  const heroImage = firstPost !== null ? postMediaMap.get(firstPost.id) ?? null : null;

  const isLoading = productsLoading || categoriesLoading;

  const HERO_HEIGHT = Dimensions.get("window").height * 0.55;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const navbarBg = scrollY > 10 ? colors.bg : "transparent";
  const navbarTextColor = scrollY > 10 ? colors.text : "#FFFFFF";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Fixed top navbar ── */}
      <SafeAreaView
        edges={["top"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          backgroundColor: navbarBg,
          borderBottomWidth: scrollY > 10 ? 1 : 0,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 16,
              color: navbarTextColor,
              letterSpacing: 3,
              fontWeight: "600",
            }}
          >
            SYSTEM APP FORMULA
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              onPress={() => router.push("/(tabs)/browse")}
            >
              <Ionicons name="search-outline" size={22} color={navbarTextColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              onPress={() => router.push("/cart")}
            >
              <Ionicons name="bag-outline" size={22} color={navbarTextColor} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero section — 55vh, full width ── */}
        <Pressable
          onPress={() => router.push("/(tabs)/profile/highlights")}
          style={{ width: "100%", height: HERO_HEIGHT }}
        >
          {heroImage !== null && heroImage.length > 0 ? (
            <Image
              source={{ uri: heroImage }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View style={{ position: "absolute", inset: 0, width: "100%", height: "100%", backgroundColor: "#111" }} />
          )}

          {/* Top gradient for navbar readability */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              background: "transparent",
            }}
            pointerEvents="none"
          />

          {/* Bottom gradient */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              justifyContent: "flex-end",
              padding: 24,
            }}
          >
            {firstPost?.caption !== null && firstPost?.caption !== undefined && firstPost.caption.length > 0 && (
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  color: "#FFFFFF",
                  fontSize: 18,
                  marginBottom: 16,
                  lineHeight: 26,
                }}
                numberOfLines={2}
              >
                {firstPost.caption}
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              <Pressable
                onPress={(e) => { router.push("/(tabs)/browse"); }}
                style={{
                  paddingHorizontal: 20,
                  height: 44,
                  borderRadius: 99,
                  backgroundColor: "rgba(255,255,255,0.92)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
                  探索新品 →
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/profile/highlights")}
                style={{
                  paddingHorizontal: 20,
                  height: 44,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
                  精选内容 →
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>

        {/* ── 2. 新品上市 grid ── */}
        <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
          {/* Section heading + divider */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 24,
                color: colors.text,
              }}
            >
              新品上市
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* 2-column product grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {sortedProducts.slice(0, 6).map((product) => {
              const thumb = productThumb(product);
              const saved = isInWishlist(product.id);
              return (
                <Pressable
                  key={product.id}
                  style={{ width: "48%" }}
                  onPress={() => router.push(`/(tabs)/browse/${product.id}`)}
                >
                  {/* 3:4 aspect ratio image — NO border radius (matches web) */}
                  <View
                    style={{
                      aspectRatio: 3 / 4,
                      backgroundColor: colors.panel,
                      overflow: "hidden",
                      marginBottom: 8,
                      width: "100%",
                    }}
                  >
                    {thumb.length > 0 ? (
                      <Image
                        source={{ uri: thumb }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: colors.panel }} />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.text,
                      fontFamily: "Inter_400Regular",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {product.name ?? ""}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: colors.accent, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
                      {formatRm(product.price)}
                    </Text>
                    <Pressable
                      onPress={(e) => {
                        void (saved ? removeFromWishlist(product.id) : addToWishlist(product.id));
                      }}
                      hitSlop={8}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name={saved ? "heart" : "heart-outline"}
                        size={18}
                        color={saved ? colors.accent : colors.muted}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {sortedProducts.length === 0 && (
            <Text style={{ textAlign: "center", color: colors.muted, paddingVertical: 32, fontFamily: "Inter_400Regular" }}>
              暂无相关商品
            </Text>
          )}
        </View>

        {/* ── 3. 商品分类 pills ── */}
        {sortedCategories.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 24,
                color: colors.text,
                paddingHorizontal: 16,
                marginBottom: 16,
              }}
            >
              商品分类
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {sortedCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push("/(tabs)/browse")}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 99,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular", whiteSpace: "nowrap" }}>
                    {CATEGORY_LABELS[cat.name ?? ""] ?? cat.name ?? ""}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── 4. Posts strip ── */}
        {sortedPosts.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 24,
                color: colors.text,
                paddingHorizontal: 16,
                marginBottom: 16,
              }}
            >
              精选推荐
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {sortedPosts.slice(0, 10).map((post) => {
                const uri = postMediaMap.get(post.id) ?? "";
                return (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push("/(tabs)/profile/highlights")}
                    style={{ width: 140, aspectRatio: 3 / 4, backgroundColor: colors.panel, overflow: "hidden" }}
                  >
                    {uri.length > 0 && (
                      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    )}
                    {post.caption !== null && post.caption.length > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          padding: 8,
                        }}
                      >
                        <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_400Regular" }} numberOfLines={2}>
                          {post.caption}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
