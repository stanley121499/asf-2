import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import type { Product } from "@/context/product/ProductContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { colors } from "@/constants/theme";
import { formatRm } from "@/lib/formatCurrency";

/**
 * Returns the first media URL for a product, or an empty string when none exists.
 *
 * @param product - Product whose primary thumbnail is needed.
 * @returns The first media URL, or "" when unavailable.
 */
function productThumb(product: Product): string {
  const first = product.medias[0];
  return typeof first?.media_url === "string" ? first.media_url : "";
}

/**
 * A single wishlist product card in the 2-column grid.
 */
function WishlistCard({
  product,
  onOpen,
  onRemove,
}: Readonly<{
  product: Product;
  onOpen: () => void;
  onRemove: () => void;
}>): React.ReactElement {
  const thumb = productThumb(product);

  return (
    <Pressable style={{ width: "48%" }} onPress={onOpen}>
      {/* 3:4 aspect ratio image — sharp edges to match home/browse grid */}
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: colors.accent,
            fontWeight: "500",
            fontFamily: "Inter_400Regular",
          }}
        >
          {formatRm(product.price)}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8} style={{ padding: 4 }}>
          <Ionicons name="heart" size={18} color={colors.accent} />
        </Pressable>
      </View>
    </Pressable>
  );
}

/**
 * Wishlist screen — push route accessible from the profile page ("我的收藏").
 *
 * Not a bottom tab: the fourth tab slot is now the store locations screen.
 * Mirrors the web `/wishlist` page (saved products grid, sign-in gate, empty state).
 */
export default function WishlistScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { wishlistItems, loading, removeFromWishlist } = useWishlistContext();

  // Redirect away when the wishlist feature is disabled platform-wide.
  useEffect(() => {
    if (!isEnabled("wishlist")) {
      router.replace("/(tabs)");
    }
  }, [isEnabled, router]);

  /**
   * Saved rows narrowed to those with a resolved product object.
   */
  const savedProducts = useMemo<Product[]>(() => {
    return wishlistItems
      .map((item) => item.product)
      .filter((product): product is Product => product !== undefined && product !== null);
  }, [wishlistItems]);

  /** Shared sticky header used across every state. */
  const header = (
    <View
      style={{
        height: 56,
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: "absolute", left: 12, padding: 4 }}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text
        style={{
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 18,
          color: colors.text,
        }}
      >
        已收藏
      </Text>
    </View>
  );

  if (!isEnabled("wishlist")) {
    return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  // Sign-in gate — wishlist rows are user-scoped (and RLS protected).
  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="heart-outline" size={40} color={colors.muted} />
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 20,
              color: colors.text,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            登录以查看收藏
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              fontFamily: "Inter_400Regular",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            您需要登录后才能查看已保存的商品
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.8}
            style={{
              marginTop: 20,
              backgroundColor: colors.text,
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_400Regular" }}>
              登录 / 注册
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : savedProducts.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="heart-outline" size={40} color={colors.muted} />
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 20,
              color: colors.text,
              marginTop: 12,
            }}
          >
            收藏夹为空
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              fontFamily: "Inter_400Regular",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            浏览商品，发现心仪款式
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/browse")}
            activeOpacity={0.8}
            style={{
              marginTop: 20,
              backgroundColor: colors.text,
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_400Regular" }}>
              去购物
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item }) => (
            <WishlistCard
              product={item}
              onOpen={() => router.push(`/(tabs)/browse/${item.id}`)}
              onRemove={() => void removeFromWishlist(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
