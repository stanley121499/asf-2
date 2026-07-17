"use client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { usePostContext } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import type { Product } from "@/context/product/ProductContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { colors } from "@/constants/theme";
import { formatRm } from "@/lib/formatCurrency";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { tenantBrand } from "@/lib/tenantBrand";
import { HomeArrivalCeremony } from "@/components/home/HomeArrivalCeremony";
import { HomeOffersStrip } from "@/components/home/HomeOffersStrip";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";

function productThumb(p: Product): string {
  const first = p.medias[0];
  return typeof first?.media_url === "string" ? first.media_url : "";
}

/**
 * Home screen:
 * 1. Transparent top navbar (tenant brand + search/cart)
 * 2. Session arrival ceremony (once per JS process)
 * 3. Hero (~42% viewport) — post image, shop-primary CTA + secondary Highlights
 * 4. Offers strip — all active promotions (flag-gated)
 * 5. New arrivals — horizontal scroll row (~2.2 cards peek)
 * 6. Categories — horizontal scroll of pill buttons with border
 * 7. Posts strip (if posts exist)
 */
export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { translateCategory, translateProduct, translatePost } =
    useContentTranslation();
  const { products, loading: productsLoading } = useProductContext();
  const { categories, loading: categoriesLoading } = useCategoryContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const { isEnabled } = useFeatureFlags();
  const promotionsEnabled = isEnabled("promotions");

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

  const windowWidth = Dimensions.get("window").width;
  const HERO_HEIGHT = Dimensions.get("window").height * 0.42;
  const ARRIVAL_CARD_WIDTH = windowWidth * 0.44;
  const brandTagline =
    typeof tenantBrand.tagline === "string" && tenantBrand.tagline.length > 0
      ? tenantBrand.tagline
      : null;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const navbarIsSolid = scrollY > 10;
  const navbarBg = navbarIsSolid ? colors.bg : "transparent";
  const navbarTextColor = navbarIsSolid ? colors.text : "#FFFFFF";
  const heroCaption =
    firstPost !== null
      ? translatePost(firstPost.id, "caption", firstPost.caption)
      : "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HomeArrivalCeremony style={{ flex: 1 }}>
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
        {!navbarIsSolid && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.42)",
            }}
          />
        )}
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
            {tenantBrand.displayName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              onPress={() => router.push("/(tabs)/browse")}
              accessibilityLabel={t("nav.openSearch")}
            >
              <Ionicons name="search-outline" size={22} color={navbarTextColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              onPress={() => router.push("/cart")}
              accessibilityLabel={t("nav.openCart")}
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
        {/* ── 1. Hero section — ~42vh, full width ── */}
        <Pressable
          onPress={() => router.push("/(tabs)/browse")}
          style={{ width: "100%", height: HERO_HEIGHT }}
          accessibilityLabel={t("home.heroAlt")}
        >
          {heroImage !== null && heroImage.length > 0 ? (
            <Image
              source={{ uri: heroImage }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#111",
              }}
            />
          )}

          {/* Layered scrims keep white text readable without adding a gradient dependency. */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              backgroundColor: "rgba(0,0,0,0.34)",
            }}
            pointerEvents="none"
          />
          <View
            style={{
              position: "absolute",
              top: 72,
              left: 0,
              right: 0,
              height: 96,
              backgroundColor: "rgba(0,0,0,0.14)",
            }}
            pointerEvents="none"
          />

          {/* Bottom caption scrim */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              backgroundColor: "rgba(0,0,0,0.34)",
              justifyContent: "flex-end",
              padding: 24,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -72,
                left: 0,
                right: 0,
                height: 96,
                backgroundColor: "rgba(0,0,0,0.18)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.18)",
              }}
            />
            {brandTagline !== null && (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
                numberOfLines={1}
              >
                {brandTagline}
              </Text>
            )}
            {heroCaption.length > 0 && (
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
                {heroCaption}
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Pressable
                onPress={() => {
                  router.push("/(tabs)/browse");
                }}
                style={{
                  paddingHorizontal: 22,
                  height: 44,
                  borderRadius: 99,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                  {t("home.heroCtaShop")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/profile/highlights")}
                style={{
                  paddingHorizontal: 16,
                  height: 40,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.55)",
                  backgroundColor: "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
                  {t("home.heroCtaHighlights")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>

        {/* ── Offers strip (active promos; hidden when flag off / empty) ── */}
        {promotionsEnabled ? <HomeOffersStrip /> : null}

        {/* ── 2. New arrivals — horizontal row ── */}
        <View style={{ marginTop: 32 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 24,
                color: colors.text,
              }}
            >
              {t("home.newArrivals")}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Pressable onPress={() => router.push("/(tabs)/browse")} hitSlop={8}>
              <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "Inter_400Regular" }}>
                {t("home.seeAllArrivals")}
              </Text>
            </Pressable>
          </View>

          {sortedProducts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {sortedProducts.slice(0, 10).map((product) => {
                const thumb = productThumb(product);
                const saved = isInWishlist(product.id);
                return (
                  <Pressable
                    key={product.id}
                    style={{ width: ARRIVAL_CARD_WIDTH }}
                    onPress={() => openBrowseProduct(router, product.id, { returnTo: "home" })}
                  >
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
                          accessibilityLabel={t("home.productAlt")}
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
                      {translateProduct(product.id, "name", product.name ?? null)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, color: colors.accent, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
                        {formatRm(product.price)}
                      </Text>
                      <Pressable
                        onPress={() => {
                          void (saved ? removeFromWishlist(product.id) : addToWishlist(product.id));
                        }}
                        hitSlop={8}
                        style={{ padding: 4 }}
                        accessibilityLabel={saved ? t("home.cardUnsaveAria") : t("home.cardSaveAria")}
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
            </ScrollView>
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: colors.muted,
                paddingVertical: 32,
                paddingHorizontal: 16,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("home.emptyProducts")}
            </Text>
          )}
        </View>

        {/* ── 3. Category pills ── */}
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
              {t("home.categories")}
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
                  <Text style={{ fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }}>
                    {translateCategory(cat.id, cat.name ?? null)}
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
              {t("home.featured")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {sortedPosts.slice(0, 10).map((post) => {
                const uri = postMediaMap.get(post.id) ?? "";
                const caption = translatePost(post.id, "caption", post.caption);
                return (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push("/(tabs)/profile/highlights")}
                    style={{ width: 140, aspectRatio: 3 / 4, backgroundColor: colors.panel, overflow: "hidden" }}
                    accessibilityLabel={t("home.postAlt")}
                  >
                    {uri.length > 0 && (
                      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    )}
                    {caption.length > 0 && (
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
                          {caption}
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
      </HomeArrivalCeremony>
    </View>
  );
}
