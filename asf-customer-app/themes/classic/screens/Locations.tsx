import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
const LIST_PADDING = 16;
const CARD_WIDTH = SCREEN_WIDTH - LIST_PADDING * 2;
const IMAGE_HEIGHT = Math.round(CARD_WIDTH * 0.62);
const CARD_CONTENT_PADDING = 16;
const MAP_BUTTON_GAP = 10;
const MAP_BUTTON_WIDTH = (CARD_WIDTH - CARD_CONTENT_PADDING * 2 - MAP_BUTTON_GAP) / 2;

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
 * Swipeable gallery with haptic page ticks; branded placeholder when no photos yet.
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
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: tokens.bg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name="storefront-outline" size={28} color={tokens.accent} />
        </View>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 16,
            color: tokens.text,
            textAlign: "center",
          }}
          numberOfLines={2}
        >
          {mallName}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 12, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
          {photosComingSoonLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width, height: IMAGE_HEIGHT }}>
      <FlatList
        data={images as string[]}
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

      {images.length > 1 && (
        <>
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "rgba(0,0,0,0.55)",
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="images-outline" size={11} color={tokens.bg} />
            <Text style={{ color: tokens.bg, fontSize: 11, fontFamily: "Inter_400Regular" }}>
              {`${index + 1}/${images.length}`}
            </Text>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: 10,
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
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? tokens.bg : "rgba(255,255,255,0.55)",
                }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress?: () => void;
}

function InfoRow({ icon, text, onPress }: Readonly<InfoRowProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const content = (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 10 }}>
      <Ionicons name={icon} size={15} color={tokens.muted} style={{ marginTop: 2 }} />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          color: onPress !== undefined ? tokens.text : tokens.muted,
          lineHeight: 20,
          fontFamily: "Inter_400Regular",
        }}
      >
        {text}
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
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

interface MapButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant: "primary" | "secondary";
  width: number;
}

/**
 * Prominent, full-height navigation button. `primary` is solid (Google Maps),
 * `secondary` is a strong outlined style (Waze).
 */
function MapButton({ label, icon, onPress, variant, width }: Readonly<MapButtonProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const isPrimary = variant === "primary";
  const surfaceBg = isPrimary ? tokens.accent : tokens.bg;
  const contentColor = isPrimary ? tokens.bg : tokens.text;

  return (
    <Pressable
      onPress={() => {
        void hapticMedium();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 52,
          borderRadius: 14,
          borderWidth: isPrimary ? 0 : 1.5,
          borderColor: tokens.text,
          backgroundColor: surfaceBg,
        }}
      >
        <Ionicons name={icon} size={20} color={contentColor} />
        <Text
          style={{
            fontSize: 15,
            color: contentColor,
            fontWeight: "600",
            fontFamily: "Inter_400Regular",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

interface StoreLocationCardProps {
  item: StoreLocation;
  distanceKm: number | null;
  isNearest: boolean;
  enterDelayMs: number;
}

function StoreLocationCard({
  item,
  distanceKm,
  isNearest,
  enterDelayMs,
}: Readonly<StoreLocationCardProps>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
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
  const mapButtonWidth = hasGoogle && hasWaze
    ? MAP_BUTTON_WIDTH
    : CARD_WIDTH - CARD_CONTENT_PADDING * 2;
  const mapButtonGap = hasGoogle && hasWaze ? MAP_BUTTON_GAP : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        delay: enterDelayMs,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        delay: enterDelayMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [enterDelayMs, fadeAnim, slideAnim]);

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
    <Animated.View
      style={{
        width: CARD_WIDTH,
        marginBottom: 16,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: tokens.bg,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isNearest ? tokens.accent : tokens.border,
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: isNearest ? 0.08 : 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        <StoreImageGallery
          images={images}
          mallName={item.mall_name}
          width={CARD_WIDTH}
          photosComingSoonLabel={t("locations.photosComingSoon")}
        />

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 19,
                color: tokens.text,
              }}
            >
              {item.name}
            </Text>
            {distanceKm !== null && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: isNearest ? "rgba(201, 169, 110, 0.15)" : tokens.panel,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Ionicons name="navigate-outline" size={12} color={isNearest ? tokens.accent : tokens.muted} />
                <Text
                  style={{
                    fontSize: 12,
                    color: isNearest ? tokens.accent : tokens.muted,
                    fontFamily: "Inter_400Regular",
                    fontWeight: "500",
                  }}
                >
                  {formatDistanceKm(distanceKm, t)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <Ionicons name="business-outline" size={13} color={tokens.accent} />
            <Text style={{ fontSize: 13, color: tokens.accent, fontFamily: "Inter_400Regular" }}>
              {item.mall_name}
            </Text>
            {isNearest && (
              <View
                style={{
                  backgroundColor: tokens.text,
                  borderRadius: 99,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 10, color: tokens.bg, fontFamily: "Inter_400Regular", fontWeight: "600" }}>
                  {t("locations.nearest")}
                </Text>
              </View>
            )}
          </View>

          <InfoRow icon="location-outline" text={formatAddress(item)} />
          {hasPhone && item.phone !== null && <InfoRow icon="call-outline" text={item.phone} onPress={onCall} />}
          {hasHours && item.opening_hours !== null && (
            <InfoRow icon="time-outline" text={item.opening_hours} />
          )}

          {(hasGoogle || hasWaze) && (
            <View style={{ flexDirection: "row", gap: mapButtonGap, marginTop: 16 }}>
              {hasGoogle && (
                <MapButton
                  label={t("locations.googleMaps")}
                  icon="navigate-outline"
                  onPress={onOpenGoogle}
                  variant="primary"
                  width={mapButtonWidth}
                />
              )}
              {hasWaze && (
                <MapButton
                  label={t("locations.waze")}
                  icon="car-outline"
                  onPress={onOpenWaze}
                  variant="secondary"
                  width={mapButtonWidth}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * Classic store locations body — sorted by nearest when available.
 * Mounted by the thin Stores route when the active pack omits `screens.Locations`.
 */
export function ClassicLocationsScreen(): React.ReactElement {
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
          console.error("[LocationsScreen]", message);
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
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: tokens.bg, borderBottomWidth: 1, borderBottomColor: tokens.border }}
      >
        <View style={{ height: 56, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: tokens.text }}>
            {t("locations.title")}
          </Text>
        </View>
      </SafeAreaView>

      {showLocationSpinner ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
          {!loading && locating && (
            <Text style={{ marginTop: 12, fontSize: 13, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
              {t("locations.locating")}
            </Text>
          )}
        </View>
      ) : rankedStores.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="location-outline" size={40} color={tokens.muted} />
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 20,
              color: tokens.text,
              marginTop: 12,
            }}
          >
            {t("locations.emptyTitle")}
          </Text>
          {permissionDenied && (
            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                color: tokens.muted,
                textAlign: "center",
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("locations.permissionDenied")}
            </Text>
          )}
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
                  fontSize: 13,
                  color: tokens.muted,
                  textAlign: "center",
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("locations.permissionDenied")}
              </Text>
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: LIST_PADDING, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: entry, index }) => (
            <StoreLocationCard
              item={entry.item}
              distanceKm={entry.distanceKm}
              isNearest={userCoords !== null && index === 0 && entry.distanceKm !== null}
              enterDelayMs={index * 60}
            />
          )}
        />
      )}
    </View>
  );
}
