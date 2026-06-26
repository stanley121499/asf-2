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
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import {
  useStoreLocationContext,
  type StoreLocation,
} from "@/context/StoreLocationContext";
import { colors } from "@/constants/theme";
import { hapticLight, hapticMedium, hapticSelection, hapticSuccess } from "@/lib/haptics";
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

async function openExternalUrl(url: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development") {
      const message = error instanceof Error ? error.message : "Failed to open URL";
      console.error("[LocationsScreen]", message);
    }
  }
}

interface StoreImageGalleryProps {
  images: readonly string[];
  mallName: string;
  width: number;
}

/**
 * Swipeable gallery with haptic page ticks; branded placeholder when no photos yet.
 */
function StoreImageGallery({
  images,
  mallName,
  width,
}: Readonly<StoreImageGalleryProps>): React.ReactElement {
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
          backgroundColor: colors.panel,
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
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name="storefront-outline" size={28} color={colors.accent} />
        </View>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 16,
            color: colors.text,
            textAlign: "center",
          }}
          numberOfLines={2}
        >
          {mallName}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>
          门店照片即将上线
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
            <Ionicons name="images-outline" size={11} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_400Regular" }}>
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
                  backgroundColor: i === index ? "#FFFFFF" : "rgba(255,255,255,0.55)",
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
  const content = (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 10 }}>
      <Ionicons name={icon} size={15} color={colors.muted} style={{ marginTop: 2 }} />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          color: onPress !== undefined ? colors.text : colors.muted,
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
  const isPrimary = variant === "primary";
  const surfaceBg = isPrimary ? colors.accent : "#FFFFFF";
  const contentColor = isPrimary ? "#FFFFFF" : colors.text;

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
          borderColor: colors.text,
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const images = useMemo(() => getUsableStoreImages(item.image_urls), [item.image_urls]);

  const hasGoogle = item.google_maps_url !== null && item.google_maps_url.length > 0;
  const hasWaze = item.waze_url !== null && item.waze_url.length > 0;
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
    if (item.google_maps_url !== null) {
      void openExternalUrl(item.google_maps_url);
    }
  }, [item.google_maps_url]);

  const onOpenWaze = useCallback((): void => {
    if (item.waze_url !== null) {
      void openExternalUrl(item.waze_url);
    }
  }, [item.waze_url]);

  const onCall = useCallback((): void => {
    if (item.phone !== null) {
      void openExternalUrl(`tel:${item.phone}`);
    }
  }, [item.phone]);

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
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isNearest ? colors.accent : colors.border,
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: isNearest ? 0.08 : 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        <StoreImageGallery images={images} mallName={item.mall_name} width={CARD_WIDTH} />

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 19,
                color: colors.text,
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
                  backgroundColor: isNearest ? "rgba(201, 169, 110, 0.15)" : colors.panel,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Ionicons name="navigate-outline" size={12} color={isNearest ? colors.accent : colors.muted} />
                <Text
                  style={{
                    fontSize: 12,
                    color: isNearest ? colors.accent : colors.muted,
                    fontFamily: "Inter_400Regular",
                    fontWeight: "500",
                  }}
                >
                  {formatDistanceKm(distanceKm)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <Ionicons name="business-outline" size={13} color={colors.accent} />
            <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "Inter_400Regular" }}>
              {item.mall_name}
            </Text>
            {isNearest && (
              <View
                style={{
                  backgroundColor: colors.text,
                  borderRadius: 99,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 10, color: "#FFFFFF", fontFamily: "Inter_400Regular", fontWeight: "600" }}>
                  最近
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
                  label="Google 地图"
                  icon="navigate-outline"
                  onPress={onOpenGoogle}
                  variant="primary"
                  width={mapButtonWidth}
                />
              )}
              {hasWaze && (
                <MapButton
                  label="Waze"
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
 * Store locations tab — sorted by nearest when location is available.
 */
export default function LocationsScreen(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { storeLocations, loading } = useStoreLocationContext();
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolveLocation(): Promise<void> {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View style={{ height: 56, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text }}>
            门店
          </Text>
        </View>
      </SafeAreaView>

      {showLocationSpinner ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
          {!loading && locating && (
            <Text style={{ marginTop: 12, fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>
              正在定位附近门店…
            </Text>
          )}
        </View>
      ) : rankedStores.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="location-outline" size={40} color={colors.muted} />
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 20,
              color: colors.text,
              marginTop: 12,
            }}
          >
            暂无门店信息
          </Text>
        </View>
      ) : (
        <FlatList
          data={rankedStores}
          keyExtractor={(entry) => entry.item.id}
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
