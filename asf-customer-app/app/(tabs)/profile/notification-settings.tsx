import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import {
  getBackgroundLocationPermissionStatus,
  openAppLocationSettings,
  requestAlwaysLocationPermission,
  syncNearbyBackgroundLocation,
} from "@/lib/backgroundLocation";
import { supabase } from "@/lib/supabase";

/** Local prefs shape mirrored from `notification_preferences`. */
type PrefsState = {
  orders_push: boolean;
  claims_push: boolean;
  promotions: boolean;
  nearby_stock_push: boolean;
};

const DEFAULT_PREFS: PrefsState = {
  orders_push: true,
  claims_push: true,
  promotions: true,
  nearby_stock_push: true,
};

type PrefKey = keyof PrefsState;

/**
 * Customer notification preference toggles (Orders · Claims · Promotions · Nearby).
 * Upserts `notification_preferences` under RLS for the signed-in user.
 * Enabling Nearby requests Always location (explain → foreground → Always).
 */
export default function NotificationSettingsScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    Location.PermissionStatus | "unavailable" | null
  >(null);

  /**
   * Refreshes Always / background location permission for the Nearby section.
   */
  const refreshLocationStatus = useCallback(async (): Promise<void> => {
    const status = await getBackgroundLocationPermissionStatus();
    setLocationStatus(status);
  }, []);

  /**
   * Loads existing prefs or seeds defaults when no row exists yet.
   */
  useEffect(() => {
    if (typeof user?.id !== "string" || user.id.length === 0) {
      setLoading(false);
      return;
    }

    const uid = user.id;
    let cancelled = false;

    async function loadPrefs(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("notification_preferences")
        .select("orders_push, claims_push, promotions, nearby_stock_push")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (fetchError !== null) {
        console.error("[prefs] load failed:", fetchError.message);
        setError(t("notifications.prefsLoadFailed"));
        setPrefs(DEFAULT_PREFS);
        setLoading(false);
        return;
      }

      if (data === null) {
        const { error: insertError } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: uid,
            orders_push: DEFAULT_PREFS.orders_push,
            claims_push: DEFAULT_PREFS.claims_push,
            promotions: DEFAULT_PREFS.promotions,
            nearby_stock_push: DEFAULT_PREFS.nearby_stock_push,
            updated_at: new Date().toISOString(),
          });

        if (cancelled) {
          return;
        }

        if (insertError !== null) {
          console.error("[prefs] seed insert failed:", insertError.message);
        }
        setPrefs(DEFAULT_PREFS);
      } else {
        setPrefs({
          orders_push: data.orders_push,
          claims_push: data.claims_push,
          promotions: data.promotions,
          nearby_stock_push: data.nearby_stock_push !== false,
        });
      }

      setLoading(false);
      void refreshLocationStatus();
    }

    void loadPrefs();

    return () => {
      cancelled = true;
    };
  }, [user?.id, t, refreshLocationStatus]);

  /**
   * Explains Always location, then requests foreground → Always, then syncs the task.
   *
   * @param uid - Authenticated user id
   */
  const promptAndEnableNearbyLocation = useCallback(
    async (uid: string): Promise<void> => {
      await new Promise<void>((resolve) => {
        Alert.alert(
          t("notifications.locationPermissionTitle"),
          t("notifications.locationPermissionBody"),
          [
            {
              text: t("notifications.locationPermissionNotNow"),
              style: "cancel",
              onPress: () => {
                resolve();
              },
            },
            {
              text: t("notifications.locationPermissionContinue"),
              onPress: () => {
                void (async () => {
                  const permission = await requestAlwaysLocationPermission();
                  if (permission !== "granted") {
                    setError(t("notifications.locationPermissionDenied"));
                    await refreshLocationStatus();
                    resolve();
                    return;
                  }
                  await syncNearbyBackgroundLocation({
                    userId: uid,
                    nearbyEnabled: true,
                    requestPermission: false,
                  });
                  await refreshLocationStatus();
                  resolve();
                })();
              },
            },
          ],
        );
      });
    },
    [refreshLocationStatus, t],
  );

  /**
   * Optimistically toggles one preference and upserts the row.
   */
  const handleToggle = useCallback(
    async (key: PrefKey, nextValue: boolean): Promise<void> => {
      if (typeof user?.id !== "string" || user.id.length === 0) {
        return;
      }

      const uid = user.id;
      const previous = prefs;
      const nextPrefs: PrefsState = { ...prefs, [key]: nextValue };
      setPrefs(nextPrefs);
      setSavingKey(key);
      setError(null);

      const { error: upsertError } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: uid,
            orders_push: nextPrefs.orders_push,
            claims_push: nextPrefs.claims_push,
            promotions: nextPrefs.promotions,
            nearby_stock_push: nextPrefs.nearby_stock_push,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      setSavingKey(null);

      if (upsertError !== null) {
        console.error("[prefs] upsert failed:", upsertError.message);
        setPrefs(previous);
        setError(t("notifications.prefsSaveFailed"));
        return;
      }

      if (key === "nearby_stock_push") {
        if (nextValue) {
          await promptAndEnableNearbyLocation(uid);
        } else {
          await syncNearbyBackgroundLocation({
            userId: uid,
            nearbyEnabled: false,
            requestPermission: false,
          });
          await refreshLocationStatus();
        }
      }
    },
    [prefs, promptAndEnableNearbyLocation, refreshLocationStatus, t, user?.id],
  );

  if (user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("notifications.settingsTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("notifications.loginRequired")}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("notifications.settingsTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  const rows: ReadonlyArray<{
    key: PrefKey;
    title: string;
    description: string;
  }> = [
    {
      key: "orders_push",
      title: t("notifications.prefOrders"),
      description: t("notifications.prefOrdersHint"),
    },
    {
      key: "claims_push",
      title: t("notifications.prefClaims"),
      description: t("notifications.prefClaimsHint"),
    },
    {
      key: "promotions",
      title: t("notifications.prefPromotions"),
      description: t("notifications.prefPromotionsHint"),
    },
    {
      key: "nearby_stock_push",
      title: t("notifications.prefNearbyStock"),
      description: t("notifications.prefNearbyStockHint"),
    },
  ];

  const showLocationSettingsLink =
    prefs.nearby_stock_push &&
    locationStatus !== null &&
    locationStatus !== "unavailable" &&
    locationStatus !== Location.PermissionStatus.GRANTED;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SubPageHeader title={t("notifications.settingsTitle")} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 14,
            color: tokens.muted,
            fontFamily: "Inter_400Regular",
            marginBottom: 20,
            lineHeight: 20,
          }}
        >
          {t("notifications.settingsIntro")}
        </Text>

        {error !== null ? (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FECACA",
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: tokens.danger, fontFamily: "Inter_400Regular" }}>
              {error}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            backgroundColor: tokens.panel,
            borderWidth: 1,
            borderColor: tokens.border,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            return (
              <View
                key={row.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: tokens.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: tokens.text,
                      fontFamily: "Inter_400Regular",
                      marginBottom: 4,
                    }}
                  >
                    {row.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: tokens.muted,
                      fontFamily: "Inter_400Regular",
                      lineHeight: 16,
                    }}
                  >
                    {row.description}
                  </Text>
                </View>
                <Switch
                  value={prefs[row.key]}
                  disabled={savingKey === row.key}
                  onValueChange={(next) => {
                    void handleToggle(row.key, next);
                  }}
                  trackColor={{ false: tokens.border, true: tokens.accent }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={row.title}
                />
              </View>
            );
          })}
        </View>

        {showLocationSettingsLink ? (
          <TouchableOpacity
            onPress={() => {
              void openAppLocationSettings();
            }}
            accessibilityRole="button"
            accessibilityLabel={t("notifications.locationOpenSettings")}
            style={{ marginBottom: 16 }}
          >
            <Text
              style={{
                fontSize: 13,
                color: tokens.accent,
                fontFamily: "Inter_400Regular",
                textDecorationLine: "underline",
              }}
            >
              {t("notifications.locationOpenSettings")}
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text
          style={{
            fontSize: 12,
            color: tokens.muted,
            fontFamily: "Inter_400Regular",
            lineHeight: 18,
          }}
        >
          {t("notifications.batteryTip")}
        </Text>
      </ScrollView>
    </View>
  );
}
