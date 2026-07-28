import { Image } from "expo-image";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import {
  useStoreLocationContext,
  type StoreLocation,
} from "@/context/StoreLocationContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { hapticMedium, hapticSuccess } from "@/lib/haptics";
import {
  canOpenStoreMaps,
  canOpenWaze,
  openGoogleMapsForStore,
  openWazeForStore,
  type StoreMapDestination,
} from "@/lib/openStoreMaps";
import { formatDistanceKm, haversineDistanceKm } from "@/lib/storeLocationDistance";

const SCREEN_WIDTH = Dimensions.get("window").width;
/** Edge-to-edge hero band — fixed height, single frame (no gallery). */
const HERO_HEIGHT = Math.round(SCREEN_WIDTH * 0.58);
const CONTENT_GUTTER = 16;
const PLATE_GAP = 20;

type UserCoords = { latitude: number; longitude: number };

type RankedStore = {
  item: StoreLocation;
  distanceKm: number | null;
};

/**
 * Keeps only admin-uploaded store photos (excludes placeholder / stock URLs).
 */
function getUsableStoreImages(urls: readonly string[]): string[] {
  return urls.filter((url) => {
    if (url.length === 0) {
      return false;
    }
    if (url.includes("picsum.photos")) {
      return false;
    }
    return true;
  });
}

/**
 * Parses nullable numeric coordinates from Supabase.
 */
function parseCoordinate(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Joins address fields into a full comma-separated line (map query fallback).
 */
function formatAddress(row: StoreLocation): string {
  const parts = [
    row.address_line_1,
    row.address_line_2,
    row.city,
    row.state,
    row.postcode,
    row.country,
  ].filter((part): part is string => typeof part === "string" && part.length > 0);
  return parts.join(", ");
}

/**
 * Short place line for the plate — street + city only when present.
 */
function formatShortAddress(row: StoreLocation): string {
  const parts = [row.address_line_1, row.city].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  if (parts.length > 0) {
    return parts.join(", ");
  }
  return formatAddress(row);
}

/**
 * Builds a map destination from store row fields (coords preferred over query).
 */
function buildMapDestination(row: StoreLocation): StoreMapDestination {
  const address = formatAddress(row);
  let query = row.name;
  if (address.length > 0) {
    query = address;
  } else if (row.mall_name.length > 0) {
    query = row.mall_name;
  }

  return {
    latitude: parseCoordinate(row.latitude),
    longitude: parseCoordinate(row.longitude),
    query,
    googleMapsUrl: row.google_maps_url,
    wazeUrl: row.waze_url,
  };
}

interface DirectionButtonProps {
  label: string;
  onPress: () => void;
  variant: "primary" | "ghost";
  /** When true, shares the row equally with a sibling; when false, fills the row. */
  fillRow: boolean;
}

/**
 * Directions control — accent fill for Maps, hairline ghost for Waze.
 * Equal-width when paired; full-width when alone.
 *
 * Surface chrome lives on an inner View: Pressable `backgroundColor` can fail to
 * paint on some RN builds, which made primary Maps (dark label) vanish on Noir’s
 * near-black canvas while ghost Waze (light label) stayed visible.
 */
function DirectionButton({
  label,
  onPress,
  variant,
  fillRow,
}: Readonly<DirectionButtonProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={() => {
        void hapticMedium();
        onPress();
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.82 : 1,
        flexGrow: fillRow ? 1 : 0,
        flexShrink: fillRow ? 1 : 0,
        flexBasis: fillRow ? 0 : undefined,
        width: fillRow ? undefined : "100%",
        alignSelf: "stretch",
      })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: isPrimary ? tokens.accent : "transparent",
          borderWidth: isPrimary ? 0 : 1,
          borderColor: tokens.border,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 44,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1,
            fontWeight: "600",
            textTransform: "uppercase",
            color: isPrimary ? tokens.bg : tokens.text,
            fontFamily: "Inter_400Regular",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

interface StoreHeroPlateProps {
  item: StoreLocation;
  distanceKm: number | null;
  isNearest: boolean;
}

/**
 * Immersive night-place plate — large hero band + composed type + Maps/Waze.
 * Single fixed-height frame (no multi-image gallery height chaos).
 */
function StoreHeroPlate({
  item,
  distanceKm,
  isNearest,
}: Readonly<StoreHeroPlateProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const images = useMemo(() => getUsableStoreImages(item.image_urls), [item.image_urls]);
  const heroUri = images[0];
  const mapDestination = useMemo(() => buildMapDestination(item), [item]);
  const mapsMessages = useMemo(
    () => ({
      unavailableTitle: t("locations.mapsUnavailableTitle"),
      unavailableMessage: t("locations.mapsUnavailableMessage"),
    }),
    [t],
  );

  const hasGoogle = canOpenStoreMaps(mapDestination);
  const hasWaze = canOpenWaze(mapDestination);
  const directionCount = (hasGoogle ? 1 : 0) + (hasWaze ? 1 : 0);
  const pairedDirections = directionCount === 2;
  const shortAddress = formatShortAddress(item);

  const onOpenGoogle = useCallback((): void => {
    void openGoogleMapsForStore(mapDestination, mapsMessages);
  }, [mapDestination, mapsMessages]);

  const onOpenWaze = useCallback((): void => {
    void openWazeForStore(mapDestination, mapsMessages);
  }, [mapDestination, mapsMessages]);

  return (
    <View style={{ marginBottom: PLATE_GAP }}>
      {/* Hero visual band — photo or strong typographic plate */}
      <View
        style={{
          width: SCREEN_WIDTH,
          height: HERO_HEIGHT,
          backgroundColor: tokens.panel,
          overflow: "hidden",
        }}
      >
        {heroUri !== undefined ? (
          <Image
            source={{ uri: heroUri }}
            style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              paddingHorizontal: CONTENT_GUTTER,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: tokens.border,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
                marginBottom: 8,
              }}
            >
              {t("locations.noirEyebrow")}
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: tokens.text,
                fontFamily: "Inter_400Regular",
                lineHeight: 28,
              }}
              numberOfLines={3}
            >
              {item.mall_name.length > 0 ? item.mall_name : item.name}
            </Text>
          </View>
        )}
      </View>

      {/* Composed meta under the band */}
      <View
        style={{
          paddingHorizontal: CONTENT_GUTTER,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 18,
              fontWeight: "600",
              color: tokens.text,
              fontFamily: "Inter_400Regular",
              lineHeight: 24,
            }}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {distanceKm !== null ? (
            <Text
              style={{
                fontSize: 12,
                color: isNearest ? tokens.accent : tokens.muted,
                fontFamily: "Inter_400Regular",
                fontWeight: isNearest ? "600" : "400",
                marginTop: 4,
              }}
            >
              {formatDistanceKm(distanceKm, t)}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 6,
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
            numberOfLines={1}
          >
            {item.mall_name}
          </Text>
          {isNearest ? (
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: tokens.accent,
                fontFamily: "Inter_400Regular",
                fontWeight: "600",
              }}
            >
              {t("locations.nearest")}
            </Text>
          ) : null}
        </View>

        {shortAddress.length > 0 ? (
          <Text
            style={{
              marginTop: 10,
              fontSize: 12,
              lineHeight: 17,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
            numberOfLines={1}
            accessibilityLabel={`${t("locations.noirAddress")}: ${shortAddress}`}
          >
            {shortAddress}
          </Text>
        ) : null}

        {/* Directions: equal-width pair, or full-width solo */}
        {directionCount > 0 ? (
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 16,
              width: "100%",
            }}
          >
            {hasGoogle ? (
              <DirectionButton
                label={t("locations.noirMaps")}
                onPress={onOpenGoogle}
                variant="primary"
                fillRow={pairedDirections}
              />
            ) : null}
            {hasWaze ? (
              <DirectionButton
                label={t("locations.waze")}
                onPress={onOpenWaze}
                variant={hasGoogle ? "ghost" : "primary"}
                fillRow={pairedDirections}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Noir Stores — composed “night places” hero plates (Tier A).
 *
 * Full-bleed image bands, quiet type, accent Maps + ghost Waze.
 * Same data path as Classic/Atelier (feature flag, store context, nearest sort).
 */
export function NoirLocationsScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { isEnabled } = useFeatureFlags();
  const { storeLocations, loading } = useStoreLocationContext();
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [locating, setLocating] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveLocation(): Promise<void> {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          if (!cancelled) {
            setPermissionDenied(true);
          }
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          void hapticSuccess();
        }
      } catch (error: unknown) {
        if (process.env.NODE_ENV === "development") {
          const message = error instanceof Error ? error.message : "Location failed";
          console.error("[NoirLocationsScreen]", message);
        }
      } finally {
        if (!cancelled) {
          setLocating(false);
        }
      }
    }

    void resolveLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  const rankedStores = useMemo((): RankedStore[] => {
    const enriched: RankedStore[] = storeLocations.map((item) => {
      const lat = parseCoordinate(item.latitude);
      const lng = parseCoordinate(item.longitude);
      let distanceKm: number | null = null;
      if (userCoords !== null && lat !== null && lng !== null) {
        distanceKm = haversineDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          lat,
          lng,
        );
      }
      return { item, distanceKm };
    });

    if (userCoords !== null) {
      return [...enriched].sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) {
          return a.item.sort_order - b.item.sort_order;
        }
        if (a.distanceKm === null) {
          return 1;
        }
        if (b.distanceKm === null) {
          return -1;
        }
        return a.distanceKm - b.distanceKm;
      });
    }

    return [...enriched].sort((a, b) => a.item.sort_order - b.item.sort_order);
  }, [storeLocations, userCoords]);

  if (!isEnabled("store_locations")) {
    return <Redirect href="/(tabs)" />;
  }

  const showLocationSpinner = loading || locating;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: tokens.bg }}>
        <View
          style={{
            paddingHorizontal: CONTENT_GUTTER,
            paddingTop: 12,
            paddingBottom: 18,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 10,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              color: tokens.muted,
              marginBottom: 6,
            }}
          >
            {t("locations.noirEyebrow")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 28,
                fontWeight: "600",
                color: tokens.text,
                flexShrink: 1,
                letterSpacing: -0.3,
              }}
            >
              {t("locations.noirTitle")}
            </Text>
            {!showLocationSpinner && rankedStores.length > 0 ? (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  letterSpacing: 0.4,
                  color: tokens.muted,
                }}
              >
                {t("locations.noirCount", { count: rankedStores.length })}
              </Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      {showLocationSpinner ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
          {!loading && locating ? (
            <Text
              style={{
                marginTop: 12,
                fontSize: 13,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("locations.locating")}
            </Text>
          ) : null}
        </View>
      ) : rankedStores.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: CONTENT_GUTTER,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              fontWeight: "600",
              color: tokens.text,
              textAlign: "center",
            }}
          >
            {t("locations.emptyTitle")}
          </Text>
          {permissionDenied ? (
            <Text
              style={{
                marginTop: 10,
                fontSize: 13,
                color: tokens.muted,
                textAlign: "center",
                fontFamily: "Inter_400Regular",
                lineHeight: 20,
              }}
            >
              {t("locations.permissionDenied")}
            </Text>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={rankedStores}
          keyExtractor={(entry) => entry.item.id}
          ListHeaderComponent={
            permissionDenied ? (
              <Text
                style={{
                  marginBottom: 12,
                  marginHorizontal: CONTENT_GUTTER,
                  fontSize: 12,
                  color: tokens.muted,
                  fontFamily: "Inter_400Regular",
                  lineHeight: 18,
                }}
              >
                {t("locations.permissionDenied")}
              </Text>
            ) : null
          }
          contentContainerStyle={{
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: entry, index }) => (
            <StoreHeroPlate
              item={entry.item}
              distanceKm={entry.distanceKm}
              isNearest={userCoords !== null && index === 0 && entry.distanceKm !== null}
            />
          )}
        />
      )}
    </View>
  );
}
