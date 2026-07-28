import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { useWarrantyRegistrationContext } from "@/context/WarrantyRegistrationContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { fonts } from "@/constants/theme";
import { formatDate } from "@/i18n/format";
import type { RegistrationSummary } from "@/lib/warranty/warrantyRegistrationApi";
import type { WarrantyRegistrationStatus } from "@/lib/warranty/warrantyTypes";

/**
 * Feature flag key for physical warranty registration / My Collection.
 * Prefer dedicated `warranty_registration` over reusing `claims` so photo-based
 * claims and card activation can be rolled out independently.
 */
const FEATURE_FLAG_KEY = "warranty_registration" as const;

/**
 * Returns a localized label for a registration lifecycle status.
 */
function statusLabel(
  status: WarrantyRegistrationStatus,
  t: (key: string) => string
): string {
  switch (status) {
    case "active":
      return t("collection.statusActive");
    case "claimed":
      return t("collection.statusClaimed");
    case "expired":
      return t("collection.statusExpired");
    case "void":
      return t("collection.statusVoid");
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * Builds the current period / tier line shown on a collection card.
 */
function tierLabel(
  item: RegistrationSummary,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (item.status !== "active") {
    return statusLabel(item.status, t);
  }
  if (item.tier.tierPercent === null || !item.tier.tierFound) {
    return t("collection.tierIneligible");
  }
  return t("collection.tierPeriod", {
    percent: item.tier.tierPercent,
    days: item.tier.daysSincePurchase,
  });
}

/**
 * My Collection hub — premium ownership list of activated warranty cards.
 * Detail / calendar / claim is Agent 4 at `collection/[registrationId]`.
 */
export default function CollectionListScreen(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();

  if (!isEnabled(FEATURE_FLAG_KEY)) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <CollectionListContent title={t("collection.title")} />;
}

/**
 * Inner list — only mounts when `warranty_registration` is on so the context
 * provider is present.
 */
function CollectionListContent({
  title,
}: Readonly<{ title: string }>): React.ReactElement {
  const tokens = useThemeTokens();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, loading: authLoading } = useAuthContext();
  const { registrations, loading, refreshRegistrations } =
    useWarrantyRegistrationContext();

  const handleActivate = useCallback((): void => {
    router.push("/(tabs)/profile/collection/activate");
  }, [router]);

  const handleOpenDetail = useCallback(
    (registrationId: string): void => {
      router.push(`/(tabs)/profile/collection/${registrationId}`);
    },
    [router]
  );

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.panel }}>
        <SubPageHeader title={title} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  if (user === null) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const activateButton = (
    <TourAnchor id={ANCHORS.collection.activate}>
      <TouchableOpacity
        onPress={handleActivate}
        hitSlop={8}
        accessibilityLabel={t("collection.activateCta")}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: tokens.text,
            fontFamily: fonts.sans,
          }}
        >
          {t("collection.activateCta")}
        </Text>
      </TouchableOpacity>
    </TourAnchor>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.panel }}>
      <SubPageHeader title={title} right={activateButton} />
      {loading && registrations.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : registrations.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 20,
              color: tokens.text,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            {t("collection.emptyTitle")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: tokens.muted,
              textAlign: "center",
              fontFamily: fonts.sans,
              marginBottom: 28,
              lineHeight: 20,
            }}
          >
            {t("collection.emptyBody")}
          </Text>
          <TouchableOpacity
            onPress={handleActivate}
            activeOpacity={0.8}
            style={{
              backgroundColor: tokens.text,
              borderRadius: 12,
              paddingHorizontal: 28,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                color: tokens.bg,
                fontSize: 15,
                fontFamily: fonts.sans,
              }}
            >
              {t("collection.activateCta")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          onRefresh={() => {
            void refreshRegistrations();
          }}
          refreshing={loading}
          renderItem={({ item }) => {
            const productName =
              item.productName !== null && item.productName.trim().length > 0
                ? item.productName
                : t("collection.productFallback");
            const storeName =
              item.purchaseStoreName !== null &&
              item.purchaseStoreName.trim().length > 0
                ? item.purchaseStoreName
                : t("collection.storeUnknown");
            const purchaseLabel = formatDate(locale, item.purchaseDate);

            return (
              <TouchableOpacity
                onPress={() => handleOpenDetail(item.id)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: tokens.bg,
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 12,
                  flexDirection: "row",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    backgroundColor: tokens.panel,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.productImageUrl !== null ? (
                    <Image
                      source={{ uri: item.productImageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="contain"
                    />
                  ) : (
                    <Text
                      style={{
                        color: tokens.accent,
                        fontFamily: fonts.display,
                        fontSize: 22,
                      }}
                    >
                      {productName.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: tokens.text,
                        fontFamily: fonts.sans,
                      }}
                      numberOfLines={2}
                    >
                      {productName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: tokens.muted,
                        fontFamily: fonts.sans,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {statusLabel(item.status, t)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: tokens.muted,
                      marginTop: 6,
                      fontFamily: fonts.sans,
                    }}
                  >
                    {t("collection.purchasedAt", {
                      store: storeName,
                      date: purchaseLabel,
                    })}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: tokens.text,
                      marginTop: 6,
                      fontFamily: fonts.sans,
                    }}
                  >
                    {tierLabel(item, t)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
