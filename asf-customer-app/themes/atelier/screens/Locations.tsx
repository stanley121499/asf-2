import { Image } from "expo-image";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { hapticLight, hapticMedium, hapticSelection, hapticSuccess } from "@/lib/haptics";
import {
  canOpenStoreMaps,
  canOpenWaze,
  openGoogleMapsForStore,
  openPhoneUrl,
  openWazeForStore,
  type StoreMapDestination,
} from "@/lib/openStoreMaps";
import { formatDistanceKm, haversineDistanceKm } from "@/lib/storeLocationDistance";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PAGE_GUTTER = 24;
const PLATE_WIDTH = SCREEN_WIDTH - PAGE_GUTTER * 2;
const IMAGE_HEIGHT = Math.round(PLATE_WIDTH * 0.55);

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
 * Joins address fields into a single comma-separated line.
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

interface StoreImageGalleryProps {
  images: readonly string[];
  mallName: string;
  width: number;
  photosComingSoonLabel: string;
}

/**
 * Quiet full-bleed gallery — paper placeholder when no admin photos yet.
 */
function StoreImageGallery({
  images,
  mallName,
  width,
  photosComingSoonLabel,
}: Readonly<StoreImageGalleryProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const [index, setIndex] = useState(0);
  const prevIndexRef = useRef(0);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex(next);
    },
    [width],
  );

  useEffect(() => {
    if (index !== prevIndexRef.current && images.length > 1) {
      void hapticSelection();
    }
    prevIndexRef.current = index;
  }, [index, images.length]);

  if (images.length === 0) {
    return (
      <View
        style={{
          width,
          height: IMAGE_HEIGHT,
          backgroundColor: tokens.panel,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
        }}
      >
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 18,
            color: tokens.text,
            textAlign: "center",
          }}
          numberOfLines={2}
        >
          {mallName}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 11,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: tokens.muted,
            fontFamily: "Inter_400Regular",
          }}
        >
          {photosComingSoonLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width, height: IMAGE_HEIGHT }}>
      <FlatList
        data={[...images]}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        keyExtractor={(uri, i) => `${uri}-${i}`}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: IMAGE_HEIGHT }}
            contentFit="cover"
            transition={200}
          />
        )}
      />

      {images.length > 1 ? (
        <View
          style={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
          pointerEvents="none"
        >
          {images.map((uri, i) => (
            <View
              key={`${uri}-dot-${i}`}
              style={{
                width: i === index ? 16 : 5,
                height: 2,
                backgroundColor: i === index ? tokens.bg : "rgba(246,241,232,0.45)",
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface MetaLineProps {
  label: string;
  value: string;
  onPress?: () => void;
}

/**
 * Colophon-style label / value row (address, hours, phone).
 */
function MetaLine({ label, value, onPress }: Readonly<MetaLineProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const body = (
    <View style={{ marginTop: 14 }}>
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: tokens.muted,
          fontFamily: "Inter_400Regular",
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 21,
          color: onPress !== undefined ? tokens.text : tokens.muted,
          fontFamily: "Inter_400Regular",
          textDecorationLine: onPress !== undefined ? "underline" : "none",
        }}
      >
        {value}
      </Text>
    </View>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        onPress={() => {
          void hapticLight();
          onPress();
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        {body}
      </Pressable>
    );
  }

  return body;
}

interface DirectionLinkProps {
  label: string;
  onPress: () => void;
}

/**
 * Secondary text link — same underline affordance as tappable phone MetaLine.
 * Kept soft (no pill CTA); wrapped so adjacent links never merge into one Text run.
 */
function DirectionLink({
  label,
  onPress,
}: Readonly<DirectionLinkProps>): React.ReactElement {
  const tokens = useThemeTokens();

  return (
    <Pressable
      onPress={() => {
        void hapticMedium();
        onPress();
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.55 : 1,
        paddingVertical: 10,
        paddingHorizontal: 2,
      })}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text
        style={{
          fontSize: 14,
          lineHeight: 21,
          color: tokens.text,
          fontFamily: "Inter_400Regular",
          textDecorationLine: "underline",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Editorial mid-dot between map actions so labels never read as one word.
 * Hosted in a View so RN never merges it with neighboring link Text nodes.
 */
function DirectionSeparator(): React.ReactElement {
  const tokens = useThemeTokens();

  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 10 }} accessible={false}>
      <Text
        style={{
          fontSize: 13,
          color: tokens.muted,
          fontFamily: "Inter_400Regular",
        }}
      >
        {"·"}
      </Text>
    </View>
  );
}

interface PlacePlateProps {
  item: StoreLocation;
  distanceKm: number | null;
  isNearest: boolean;
  ordinal: string;
}

/**
 * Editorial store plate — lookbook caption + quiet directions, not a card stack.
 */
function PlacePlate({
  item,
  distanceKm,
  isNearest,
  ordinal,
}: Readonly<PlacePlateProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const images = useMemo(() => getUsableStoreImages(item.image_urls), [item.image_urls]);
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
  const hasPhone = item.phone !== null && item.phone.length > 0;
  const hasHours = item.opening_hours !== null && item.opening_hours.length > 0;

  const onOpenGoogle = useCallback((): void => {
    void openGoogleMapsForStore(mapDestination, mapsMessages);
  }, [mapDestination, mapsMessages]);

  const onOpenWaze = useCallback((): void => {
    void openWazeForStore(mapDestination, mapsMessages);
  }, [mapDestination, mapsMessages]);

  const onCall = useCallback((): void => {
    if (item.phone !== null) {
      void openPhoneUrl(item.phone, mapsMessages);
    }
  }, [item.phone, mapsMessages]);

  return (
    <View
      style={{
        width: PLATE_WIDTH,
        marginBottom: 36,
        borderTopWidth: 1,
        borderTopColor: tokens.border,
        paddingTop: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 2,
            color: tokens.muted,
            fontFamily: "Inter_400Regular",
          }}
        >
          {ordinal}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
          {isNearest ? (
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: tokens.accent,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("locations.nearest")}
            </Text>
          ) : null}
          {distanceKm !== null ? (
            <Text
              style={{
                fontSize: 12,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {formatDistanceKm(distanceKm, t)}
            </Text>
          ) : null}
        </View>
      </View>

      <StoreImageGallery
        images={images}
        mallName={item.mall_name}
        width={PLATE_WIDTH}
        photosComingSoonLabel={t("locations.photosComingSoon")}
      />

      <Text
        style={{
          marginTop: 18,
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 24,
          color: tokens.text,
          lineHeight: 30,
        }}
      >
        {item.name}
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 13,
          color: tokens.accent,
          fontFamily: "Inter_400Regular",
        }}
      >
        {item.mall_name}
      </Text>

      <MetaLine label={t("locations.atelierAddress")} value={formatAddress(item)} />
      {hasPhone && item.phone !== null ? (
        <MetaLine label={t("locations.atelierPhone")} value={item.phone} onPress={onCall} />
      ) : null}
      {hasHours && item.opening_hours !== null ? (
        <MetaLine label={t("locations.atelierHours")} value={item.opening_hours} />
      ) : null}

      {(hasGoogle || hasWaze) ? (
        <View style={{ marginTop: 14 }}>
          <Text
            style={{
              fontSize: 10,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              marginBottom: 2,
            }}
          >
            {t("locations.directions")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {hasGoogle ? (
              <DirectionLink label={t("locations.googleMaps")} onPress={onOpenGoogle} />
            ) : null}
            {hasGoogle && hasWaze ? <DirectionSeparator /> : null}
            {hasWaze ? (
              <DirectionLink label={t("locations.waze")} onPress={onOpenWaze} />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Zero-pads a 1-based place index for editorial captions (`01`, `02`, …).
 */
function placeOrdinal(index: number): string {
  const n = index + 1;
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Atelier Stores — “Places” lookbook / colophon list (Tier A).
 *
 * Paper ground, Playfair titles, ordinal plates, and quiet direction links.
 * Same data path as Classic (feature flag, store context, nearest sort) with
 * magazine chrome instead of card-stack locator UI.
 */
export function AtelierLocationsScreen(): React.ReactElement {
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
          console.error("[AtelierLocationsScreen]", message);
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
            paddingHorizontal: PAGE_GUTTER,
            paddingTop: 12,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 11,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: tokens.muted,
              marginBottom: 6,
            }}
          >
            {t("locations.atelierEyebrow")}
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
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 28,
                color: tokens.text,
                flexShrink: 1,
              }}
            >
              {t("locations.atelierTitle")}
            </Text>
            {!showLocationSpinner && rankedStores.length > 0 ? (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: tokens.muted,
                }}
              >
                {t("locations.atelierCount", { count: rankedStores.length })}
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
            paddingHorizontal: PAGE_GUTTER,
          }}
        >
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 22,
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
                  marginBottom: 8,
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
            paddingHorizontal: PAGE_GUTTER,
            paddingTop: 20,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: entry, index }) => (
            <PlacePlate
              item={entry.item}
              distanceKm={entry.distanceKm}
              isNearest={userCoords !== null && index === 0 && entry.distanceKm !== null}
              ordinal={placeOrdinal(index)}
            />
          )}
        />
      )}
    </View>
  );
}
