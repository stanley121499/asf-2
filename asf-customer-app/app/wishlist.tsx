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
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";
import type { Product } from "@/context/product/ProductContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { openBrowseProduct } from "@/lib/browseNavigation";
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
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const thumb = productThumb(product);
  const translatedName = translateProduct(product.id, "name", product.name ?? null);
  const displayName = translatedName.length > 0 ? translatedName : t("common.product");

  return (
    <Pressable style={{ width: "48%" }} onPress={onOpen}>
      {/* 3:4 aspect ratio image — sharp edges to match home/browse grid */}
      <View
        style={{
          aspectRatio: 3 / 4,
          backgroundColor: tokens.panel,
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
          <View style={{ flex: 1, backgroundColor: tokens.panel }} />
        )}
      </View>
      <Text
        style={{
          fontSize: 13,
          color: tokens.text,
          fontFamily: "Inter_400Regular",
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {displayName}
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
            color: tokens.accent,
            fontWeight: "500",
            fontFamily: "Inter_400Regular",
          }}
        >
          {formatRm(product.price)}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8} style={{ padding: 4 }}>
          <Ionicons name="heart" size={18} color={tokens.accent} />
        </Pressable>
      </View>
    </Pressable>
  );
}

/**
 * Wishlist screen — push route accessible from the profile page.
 *
 * Not a bottom tab: the fourth tab slot is now the store locations screen.
 * Mirrors the web `/wishlist` page (saved products grid, sign-in gate, empty state).
 */
export default function WishlistScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isNoir = themeId === "noir";
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { wishlistItems, loading, removeFromWishlist } = useWishlistContext();
  /** Display face: Inter under Noir; Playfair for Classic/Atelier. */
  const displayFont = isNoir ? "Inter_400Regular" : "PlayfairDisplay_400Regular";

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
        borderBottomColor: tokens.border,
        backgroundColor: tokens.bg,
        flexDirection: "row",
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: "absolute", left: 12, padding: 4 }}
      >
        <Ionicons name="chevron-back" size={24} color={tokens.text} />
      </TouchableOpacity>
      <Text
        style={{
          fontFamily: displayFont,
          fontSize: isNoir ? 16 : 18,
          fontWeight: isNoir ? "600" : "400",
          letterSpacing: isNoir ? 0.5 : 0,
          color: tokens.text,
        }}
      >
        {t("wishlist.title")}
      </Text>
    </View>
  );

  if (!isEnabled("wishlist")) {
    return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }} />;
  }

  // Sign-in gate — wishlist rows are user-scoped (and RLS protected).
  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="heart-outline" size={40} color={tokens.muted} />
          <Text
            style={{
              fontFamily: displayFont,
              fontSize: isNoir ? 16 : 20,
              fontWeight: isNoir ? "600" : "400",
              letterSpacing: isNoir ? 0.5 : 0,
              color: tokens.text,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {t("wishlist.signInTitle")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {t("wishlist.signInBody")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.8}
            style={{
              marginTop: 20,
              backgroundColor: isNoir ? tokens.accent : tokens.text,
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: isNoir ? 2 : 12,
            }}
          >
            <Text style={{ color: tokens.bg, fontSize: 14, fontFamily: "Inter_400Regular", fontWeight: isNoir ? "600" : "400" }}>
              {t("wishlist.signInCta")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
      {header}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : savedProducts.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="heart-outline" size={40} color={tokens.muted} />
          <Text
            style={{
              fontFamily: displayFont,
              fontSize: isNoir ? 16 : 20,
              fontWeight: isNoir ? "600" : "400",
              letterSpacing: isNoir ? 0.5 : 0,
              color: tokens.text,
              marginTop: 12,
            }}
          >
            {t("wishlist.emptyProductsTitle")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {t("wishlist.emptyProductsBody")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/browse")}
            activeOpacity={0.8}
            style={{
              marginTop: 20,
              backgroundColor: isNoir ? tokens.accent : tokens.text,
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: isNoir ? 2 : 12,
            }}
          >
            <Text style={{ color: tokens.bg, fontSize: 14, fontFamily: "Inter_400Regular", fontWeight: isNoir ? "600" : "400" }}>
              {t("wishlist.goShopping")}
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
              onOpen={() => openBrowseProduct(router, item.id, { returnTo: "wishlist" })}
              onRemove={() => void removeFromWishlist(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
